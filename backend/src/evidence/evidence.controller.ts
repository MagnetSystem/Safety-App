import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { EvidenceService } from './evidence.service';
import { RequestUploadUrlDto } from './dto/request-upload-url.dto';
import { ConfirmEvidenceDto } from './dto/confirm-evidence.dto';

@Controller('complaints/:complaintId/evidence')
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Post('upload-url')
  requestUploadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Param('complaintId', ParseUUIDPipe) complaintId: string,
    @Body() dto: RequestUploadUrlDto,
  ) {
    return this.evidenceService.requestUploadUrl(user, complaintId, dto);
  }

  @Post()
  @Audit({ action: 'EVIDENCE_UPLOADED', entityType: 'Complaint', entityIdParam: 'complaintId' })
  confirmUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('complaintId', ParseUUIDPipe) complaintId: string,
    @Body() dto: ConfirmEvidenceDto,
  ) {
    return this.evidenceService.confirmUpload(user, complaintId, dto);
  }

  @Get()
  @Audit({ action: 'EVIDENCE_DOWNLOADED', entityType: 'Complaint', entityIdParam: 'complaintId' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('complaintId', ParseUUIDPipe) complaintId: string,
  ) {
    return this.evidenceService.list(user, complaintId);
  }
}
