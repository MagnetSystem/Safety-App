import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { EvidenceService } from './evidence.service';
import { RequestUploadUrlDto } from './dto/request-upload-url.dto';
import { ConfirmEvidenceDto } from './dto/confirm-evidence.dto';

@Controller([
  'incidents/:incidentId/evidence',
  'complaints/:incidentId/evidence',
])
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Post('upload-url')
  requestUploadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Param('incidentId', ParseUUIDPipe) incidentId: string,
    @Body() dto: RequestUploadUrlDto,
  ) {
    return this.evidenceService.requestUploadUrl(user, incidentId, dto);
  }

  @Post()
  @Audit({ action: 'EVIDENCE_UPLOADED', entityType: 'Incident', entityIdParam: 'incidentId' })
  confirmUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('incidentId', ParseUUIDPipe) incidentId: string,
    @Body() dto: ConfirmEvidenceDto,
  ) {
    return this.evidenceService.confirmUpload(user, incidentId, dto);
  }

  @Get()
  @Audit({ action: 'EVIDENCE_DOWNLOADED', entityType: 'Incident', entityIdParam: 'incidentId' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('incidentId', ParseUUIDPipe) incidentId: string,
  ) {
    return this.evidenceService.list(user, incidentId);
  }
}
