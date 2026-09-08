-- Safety Platform: College/Student/Complaint → Organization/Member/Incident
-- plus Owner/Admin/Staff roles, Guardian links, and tenant RLS.

SELECT set_config('app.bypass_rls', 'true', false);

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE "UserRole_new" AS ENUM ('MEMBER', 'GUARDIAN', 'STAFF', 'ADMIN', 'OWNER', 'SUPPORT');
CREATE TYPE "OrgRole" AS ENUM ('OWNER', 'ADMIN', 'STAFF');
CREATE TYPE "OrganizationIndustry" AS ENUM ('EDUCATION', 'CORPORATE', 'CARE_HOME', 'CUSTOM');
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE "GuardianLinkStatus" AS ENUM ('PENDING', 'ACTIVE', 'REVOKED');
CREATE TYPE "IncidentStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'INVESTIGATING', 'MORE_INFO_REQUESTED', 'RESOLVED', 'CLOSED');
CREATE TYPE "IncidentPriority" AS ENUM ('CRITICAL', 'HIGH', 'NORMAL', 'LOW');

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'GUARDIAN_EMERGENCY';

-- ---------------------------------------------------------------------------
-- Rename tables
-- ---------------------------------------------------------------------------

ALTER TABLE "colleges" RENAME TO "organizations";
ALTER TABLE "students" RENAME TO "members";
ALTER TABLE "college_admins" RENAME TO "org_staff";
ALTER TABLE "complaints" RENAME TO "incidents";
ALTER TABLE "complaint_evidence" RENAME TO "incident_evidence";
ALTER TABLE "complaint_messages" RENAME TO "incident_messages";
ALTER TABLE "complaint_timeline" RENAME TO "incident_timeline";

-- ---------------------------------------------------------------------------
-- Organizations
-- ---------------------------------------------------------------------------

ALTER TABLE "organizations" RENAME COLUMN "principal" TO "contactName";
ALTER TABLE "organizations" ADD COLUMN "joinCode" TEXT;
ALTER TABLE "organizations" ADD COLUMN "industry" "OrganizationIndustry" NOT NULL DEFAULT 'EDUCATION';
ALTER TABLE "organizations" ADD COLUMN "logoUrl" TEXT;
ALTER TABLE "organizations" ADD COLUMN "settings" JSONB NOT NULL DEFAULT '{}';

ALTER TABLE "organizations" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "organizations" ALTER COLUMN "status" TYPE "OrganizationStatus" USING (
  CASE "status"::text WHEN 'SUSPENDED' THEN 'SUSPENDED' ELSE 'ACTIVE' END
)::"OrganizationStatus";
ALTER TABLE "organizations" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

CREATE OR REPLACE FUNCTION _gen_join_code() RETURNS TEXT AS $$
DECLARE
  alphabet TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

UPDATE "organizations"
SET "joinCode" = _gen_join_code() || substr(id, 1, 4)
WHERE "joinCode" IS NULL;

ALTER TABLE "organizations" ALTER COLUMN "joinCode" SET NOT NULL;
CREATE UNIQUE INDEX "organizations_joinCode_key" ON "organizations"("joinCode");

UPDATE "organizations" SET "settings" = jsonb_build_object(
  'categories', '["PHYSICAL_RAGGING","VERBAL_ABUSE","MENTAL_HARASSMENT","THREAT","HOSTEL_RAGGING","CLASSROOM_RAGGING","CYBER_BULLYING","MONEY_EXTORTION","SEXUAL_HARASSMENT","OTHER"]'::jsonb,
  'features', '{"guardianAlerts":true,"bulkSignup":false,"reporting":true}'::jsonb,
  'profileFields', '["course","year","department","isHosteler","hostelAddress","memberNumber"]'::jsonb
);

DROP TYPE "CollegeStatus";

-- ---------------------------------------------------------------------------
-- Members
-- ---------------------------------------------------------------------------

ALTER TABLE "members" RENAME COLUMN "collegeId" TO "organizationId";
ALTER TABLE "members" RENAME COLUMN "studentNumber" TO "memberNumber";
ALTER TABLE "members" ALTER COLUMN "organizationId" DROP NOT NULL;
ALTER TABLE "members" ADD COLUMN "profile" JSONB NOT NULL DEFAULT '{}';

ALTER INDEX "students_userId_key" RENAME TO "members_userId_key";
ALTER INDEX "students_collegeId_idx" RENAME TO "members_organizationId_idx";
ALTER INDEX "students_studentNumber_idx" RENAME TO "members_memberNumber_idx";
ALTER TABLE "members" RENAME CONSTRAINT "students_pkey" TO "members_pkey";
ALTER TABLE "members" RENAME CONSTRAINT "students_userId_fkey" TO "members_userId_fkey";
ALTER TABLE "members" RENAME CONSTRAINT "students_collegeId_fkey" TO "members_organizationId_fkey";

-- ---------------------------------------------------------------------------
-- Org staff
-- ---------------------------------------------------------------------------

ALTER TABLE "org_staff" RENAME COLUMN "collegeId" TO "organizationId";
ALTER TABLE "org_staff" ADD COLUMN "orgRole" "OrgRole" NOT NULL DEFAULT 'ADMIN';

ALTER INDEX "college_admins_userId_key" RENAME TO "org_staff_userId_key";
ALTER INDEX "college_admins_collegeId_idx" RENAME TO "org_staff_organizationId_idx";
CREATE INDEX "org_staff_organizationId_orgRole_idx" ON "org_staff"("organizationId", "orgRole");
ALTER TABLE "org_staff" RENAME CONSTRAINT "college_admins_pkey" TO "org_staff_pkey";
ALTER TABLE "org_staff" RENAME CONSTRAINT "college_admins_userId_fkey" TO "org_staff_userId_fkey";
ALTER TABLE "org_staff" RENAME CONSTRAINT "college_admins_collegeId_fkey" TO "org_staff_organizationId_fkey";

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "organizationId" ORDER BY "createdAt" ASC) AS rn
  FROM "org_staff"
)
UPDATE "org_staff" SET "orgRole" = 'OWNER'
FROM ranked
WHERE "org_staff".id = ranked.id AND ranked.rn = 1;

-- ---------------------------------------------------------------------------
-- Incidents
-- ---------------------------------------------------------------------------

ALTER TABLE "incidents" RENAME COLUMN "collegeId" TO "organizationId";
ALTER TABLE "incidents" RENAME COLUMN "studentId" TO "memberId";
ALTER TABLE "incidents" RENAME COLUMN "suspectedStudents" TO "suspectedPeople";
ALTER TABLE "incidents" ALTER COLUMN "organizationId" DROP NOT NULL;

ALTER TABLE "incidents" ADD COLUMN "assignedToUserId" TEXT;
UPDATE "incidents"
SET "assignedToUserId" = "assignedCommitteeUserIds"[1]
WHERE array_length("assignedCommitteeUserIds", 1) >= 1;
ALTER TABLE "incidents" DROP COLUMN "assignedCommitteeUserIds";

ALTER TABLE "incidents" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "incidents" ALTER COLUMN "status" TYPE "IncidentStatus" USING "status"::text::"IncidentStatus";
ALTER TABLE "incidents" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';

ALTER TABLE "incidents" ALTER COLUMN "priority" DROP DEFAULT;
ALTER TABLE "incidents" ALTER COLUMN "priority" TYPE "IncidentPriority" USING "priority"::text::"IncidentPriority";
ALTER TABLE "incidents" ALTER COLUMN "priority" SET DEFAULT 'NORMAL';

ALTER TABLE "incidents" ALTER COLUMN "category" TYPE TEXT USING "category"::text;

ALTER INDEX "complaints_code_key" RENAME TO "incidents_code_key";
ALTER INDEX "complaints_collegeId_status_idx" RENAME TO "incidents_organizationId_status_idx";
ALTER INDEX "complaints_collegeId_createdAt_idx" RENAME TO "incidents_organizationId_createdAt_idx";
ALTER INDEX "complaints_studentId_idx" RENAME TO "incidents_memberId_idx";
CREATE INDEX "incidents_assignedToUserId_idx" ON "incidents"("assignedToUserId");
CREATE INDEX "incidents_type_status_idx" ON "incidents"("type", "status");

ALTER TABLE "incidents" RENAME CONSTRAINT "complaints_pkey" TO "incidents_pkey";
ALTER TABLE "incidents" RENAME CONSTRAINT "complaints_collegeId_fkey" TO "incidents_organizationId_fkey";
ALTER TABLE "incidents" RENAME CONSTRAINT "complaints_studentId_fkey" TO "incidents_memberId_fkey";
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_assignedToUserId_fkey"
  FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DROP TYPE "ComplaintStatus";
DROP TYPE "ComplaintPriority";
DROP TYPE "IncidentCategory";

-- ---------------------------------------------------------------------------
-- Incident children
-- ---------------------------------------------------------------------------

ALTER TABLE "incident_evidence" RENAME COLUMN "complaintId" TO "incidentId";
ALTER INDEX "complaint_evidence_complaintId_idx" RENAME TO "incident_evidence_incidentId_idx";
ALTER TABLE "incident_evidence" RENAME CONSTRAINT "complaint_evidence_pkey" TO "incident_evidence_pkey";
ALTER TABLE "incident_evidence" RENAME CONSTRAINT "complaint_evidence_complaintId_fkey" TO "incident_evidence_incidentId_fkey";

ALTER TABLE "incident_messages" RENAME COLUMN "complaintId" TO "incidentId";
ALTER INDEX "complaint_messages_complaintId_createdAt_idx" RENAME TO "incident_messages_incidentId_createdAt_idx";
ALTER TABLE "incident_messages" RENAME CONSTRAINT "complaint_messages_pkey" TO "incident_messages_pkey";
ALTER TABLE "incident_messages" RENAME CONSTRAINT "complaint_messages_complaintId_fkey" TO "incident_messages_incidentId_fkey";
ALTER TABLE "incident_messages" RENAME CONSTRAINT "complaint_messages_authorId_fkey" TO "incident_messages_authorId_fkey";

ALTER TABLE "incident_timeline" RENAME COLUMN "complaintId" TO "incidentId";
ALTER TABLE "incident_timeline" ALTER COLUMN "status" TYPE "IncidentStatus" USING "status"::text::"IncidentStatus";
ALTER INDEX "complaint_timeline_complaintId_idx" RENAME TO "incident_timeline_incidentId_idx";
ALTER TABLE "incident_timeline" RENAME CONSTRAINT "complaint_timeline_pkey" TO "incident_timeline_pkey";
ALTER TABLE "incident_timeline" RENAME CONSTRAINT "complaint_timeline_complaintId_fkey" TO "incident_timeline_incidentId_fkey";

-- ---------------------------------------------------------------------------
-- Audit logs
-- ---------------------------------------------------------------------------

ALTER TABLE "audit_logs" RENAME COLUMN "collegeId" TO "organizationId";
ALTER INDEX "audit_logs_collegeId_createdAt_idx" RENAME TO "audit_logs_organizationId_createdAt_idx";
ALTER TABLE "audit_logs" RENAME CONSTRAINT "audit_logs_collegeId_fkey" TO "audit_logs_organizationId_fkey";
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");

-- ---------------------------------------------------------------------------
-- Users + message authorRole enum swap
-- ---------------------------------------------------------------------------

ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING (
  CASE "role"::text
    WHEN 'STUDENT' THEN 'MEMBER'
    WHEN 'COLLEGE_ADMIN' THEN 'ADMIN'
    WHEN 'SUPER_ADMIN' THEN 'SUPPORT'
    ELSE 'MEMBER'
  END
)::"UserRole_new";

ALTER TABLE "incident_messages" ALTER COLUMN "authorRole" TYPE "UserRole_new" USING (
  CASE "authorRole"::text
    WHEN 'STUDENT' THEN 'MEMBER'
    WHEN 'COLLEGE_ADMIN' THEN 'ADMIN'
    WHEN 'SUPER_ADMIN' THEN 'SUPPORT'
    ELSE 'MEMBER'
  END
)::"UserRole_new";

DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

UPDATE "users" SET "role" = 'OWNER'
WHERE id IN (SELECT "userId" FROM "org_staff" WHERE "orgRole" = 'OWNER');

-- ---------------------------------------------------------------------------
-- Guardian links
-- ---------------------------------------------------------------------------

CREATE TABLE "guardian_links" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "guardianUserId" TEXT,
    "inviteCodeHash" TEXT,
    "inviteCodeExpiresAt" TIMESTAMP(3),
    "status" "GuardianLinkStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "guardian_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "guardian_links_inviteCodeHash_key" ON "guardian_links"("inviteCodeHash");
CREATE INDEX "guardian_links_memberId_status_idx" ON "guardian_links"("memberId", "status");
CREATE INDEX "guardian_links_guardianUserId_idx" ON "guardian_links"("guardianUserId");

ALTER TABLE "guardian_links" ADD CONSTRAINT "guardian_links_memberId_fkey"
  FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "guardian_links" ADD CONSTRAINT "guardian_links_guardianUserId_fkey"
  FOREIGN KEY ("guardianUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Remaining organization indexes
-- ---------------------------------------------------------------------------

ALTER INDEX "colleges_code_key" RENAME TO "organizations_code_key";
ALTER INDEX "colleges_status_idx" RENAME TO "organizations_status_idx";
CREATE INDEX "organizations_industry_idx" ON "organizations"("industry");
ALTER TABLE "organizations" RENAME CONSTRAINT "colleges_pkey" TO "organizations_pkey";

-- ---------------------------------------------------------------------------
-- Row-Level Security (second lock). App sets:
--   app.organization_id, app.user_id, app.bypass_rls
-- Support sets bypass_rls=true after a logged enter-organization action.
-- ---------------------------------------------------------------------------

ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organizations" FORCE ROW LEVEL SECURITY;
ALTER TABLE "members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "members" FORCE ROW LEVEL SECURITY;
ALTER TABLE "org_staff" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "org_staff" FORCE ROW LEVEL SECURITY;
ALTER TABLE "incidents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "incidents" FORCE ROW LEVEL SECURITY;
ALTER TABLE "incident_evidence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "incident_evidence" FORCE ROW LEVEL SECURITY;
ALTER TABLE "incident_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "incident_messages" FORCE ROW LEVEL SECURITY;
ALTER TABLE "incident_timeline" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "incident_timeline" FORCE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" FORCE ROW LEVEL SECURITY;
ALTER TABLE "guardian_links" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "guardian_links" FORCE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION app_bypass_rls() RETURNS BOOLEAN AS $$
  SELECT coalesce(current_setting('app.bypass_rls', true), '') = 'true';
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_org_id() RETURNS TEXT AS $$
  SELECT nullif(current_setting('app.organization_id', true), '');
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_user_id() RETURNS TEXT AS $$
  SELECT nullif(current_setting('app.user_id', true), '');
$$ LANGUAGE sql STABLE;

CREATE POLICY organizations_isolation ON "organizations"
  USING (app_bypass_rls() OR id = app_org_id());

CREATE POLICY members_isolation ON "members"
  USING (
    app_bypass_rls()
    OR ("organizationId" IS NOT NULL AND "organizationId" = app_org_id())
    OR ("userId" = app_user_id())
  );

CREATE POLICY org_staff_isolation ON "org_staff"
  USING (app_bypass_rls() OR "organizationId" = app_org_id() OR "userId" = app_user_id());

CREATE POLICY incidents_isolation ON "incidents"
  USING (
    app_bypass_rls()
    OR ("organizationId" IS NOT NULL AND "organizationId" = app_org_id())
    OR EXISTS (
      SELECT 1 FROM "members" m
      WHERE m.id = "incidents"."memberId" AND m."userId" = app_user_id()
    )
    OR (
      type = 'EMERGENCY'
      AND EXISTS (
        SELECT 1 FROM "guardian_links" gl
        WHERE gl."memberId" = "incidents"."memberId"
          AND gl."guardianUserId" = app_user_id()
          AND gl.status = 'ACTIVE'
      )
    )
  );

CREATE POLICY incident_evidence_isolation ON "incident_evidence"
  USING (
    app_bypass_rls()
    OR EXISTS (SELECT 1 FROM "incidents" i WHERE i.id = "incident_evidence"."incidentId")
  );

CREATE POLICY incident_messages_isolation ON "incident_messages"
  USING (
    app_bypass_rls()
    OR EXISTS (SELECT 1 FROM "incidents" i WHERE i.id = "incident_messages"."incidentId")
  );

CREATE POLICY incident_timeline_isolation ON "incident_timeline"
  USING (
    app_bypass_rls()
    OR EXISTS (SELECT 1 FROM "incidents" i WHERE i.id = "incident_timeline"."incidentId")
  );

CREATE POLICY audit_logs_isolation ON "audit_logs"
  USING (app_bypass_rls() OR "organizationId" = app_org_id());

CREATE POLICY guardian_links_isolation ON "guardian_links"
  USING (
    app_bypass_rls()
    OR "guardianUserId" = app_user_id()
    OR EXISTS (
      SELECT 1 FROM "members" m
      WHERE m.id = "guardian_links"."memberId" AND m."userId" = app_user_id()
    )
    OR EXISTS (
      SELECT 1 FROM "members" m
      WHERE m.id = "guardian_links"."memberId" AND m."organizationId" = app_org_id()
    )
  );

DROP FUNCTION IF EXISTS _gen_join_code();
