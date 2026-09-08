SELECT set_config('app.bypass_rls', 'true', false);

CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "departments_organizationId_slug_key" ON "departments"("organizationId", "slug");
CREATE INDEX "departments_organizationId_idx" ON "departments"("organizationId");

ALTER TABLE "departments" ADD CONSTRAINT "departments_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "department_staff" (
    "departmentId" TEXT NOT NULL,
    "orgStaffId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "department_staff_pkey" PRIMARY KEY ("departmentId","orgStaffId")
);

CREATE INDEX "department_staff_orgStaffId_idx" ON "department_staff"("orgStaffId");

ALTER TABLE "department_staff" ADD CONSTRAINT "department_staff_departmentId_fkey"
  FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "department_staff" ADD CONSTRAINT "department_staff_orgStaffId_fkey"
  FOREIGN KEY ("orgStaffId") REFERENCES "org_staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "members" ADD COLUMN "assignedDepartmentId" TEXT;
CREATE INDEX "members_assignedDepartmentId_idx" ON "members"("assignedDepartmentId");
ALTER TABLE "members" ADD CONSTRAINT "members_assignedDepartmentId_fkey"
  FOREIGN KEY ("assignedDepartmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "incidents" ADD COLUMN "departmentId" TEXT;
CREATE INDEX "incidents_organizationId_departmentId_status_idx" ON "incidents"("organizationId", "departmentId", "status");
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_departmentId_fkey"
  FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "departments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "departments" FORCE ROW LEVEL SECURITY;
ALTER TABLE "department_staff" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "department_staff" FORCE ROW LEVEL SECURITY;

CREATE POLICY departments_isolation ON "departments"
  USING (
    coalesce(current_setting('app.bypass_rls', true), '') = 'true'
    OR "organizationId" = nullif(current_setting('app.organization_id', true), '')
  );

CREATE POLICY department_staff_isolation ON "department_staff"
  USING (
    coalesce(current_setting('app.bypass_rls', true), '') = 'true'
    OR EXISTS (
      SELECT 1 FROM "departments" d
      WHERE d.id = "department_staff"."departmentId"
        AND d."organizationId" = nullif(current_setting('app.organization_id', true), '')
    )
  );
