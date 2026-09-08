SELECT set_config('app.bypass_rls', 'true', false);

-- CreateIndex
CREATE INDEX "incidents_organizationId_status_createdAt_idx" ON "incidents"("organizationId", "status", "createdAt" DESC);
