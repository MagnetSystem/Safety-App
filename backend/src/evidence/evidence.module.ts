import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { ComplaintsModule } from '../complaints/complaints.module';
import { EvidenceService } from './evidence.service';
import { EvidenceController } from './evidence.controller';
import { StorageService } from './storage.service';

@Module({
  imports: [NotificationsModule, ComplaintsModule],
  controllers: [EvidenceController],
  providers: [EvidenceService, StorageService],
})
export class EvidenceModule {}
