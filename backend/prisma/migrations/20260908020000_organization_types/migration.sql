SELECT set_config('app.bypass_rls', 'true', false);

ALTER TABLE "organizations" ALTER COLUMN "industry" DROP DEFAULT;
ALTER TABLE "organizations" ALTER COLUMN "industry" TYPE TEXT USING "industry"::text;
ALTER TABLE "organizations" ALTER COLUMN "industry" SET DEFAULT 'EDUCATION';

DROP TYPE IF EXISTS "OrganizationIndustry";

CREATE TABLE "organization_types" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "blurb" TEXT NOT NULL DEFAULT '',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "features" JSONB NOT NULL DEFAULT '{}',
    "categories" JSONB NOT NULL DEFAULT '[]',
    "defaultDepartments" JSONB NOT NULL DEFAULT '[]',
    "orgSetupFields" JSONB NOT NULL DEFAULT '[]',
    "memberFields" JSONB NOT NULL DEFAULT '[]',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organization_types_slug_key" ON "organization_types"("slug");
CREATE INDEX "organization_types_isActive_idx" ON "organization_types"("isActive");

ALTER TABLE "organizations" ADD COLUMN "organizationTypeId" TEXT;
CREATE INDEX "organizations_organizationTypeId_idx" ON "organizations"("organizationTypeId");
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_organizationTypeId_fkey"
  FOREIGN KEY ("organizationTypeId") REFERENCES "organization_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
