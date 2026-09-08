import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { IncidentsModule } from '../incidents/incidents.module';
import { EvidenceService } from './evidence.service';
import { EvidenceController } from './evidence.controller';
import { StorageService } from './storage.service';

@Module({
  imports: [NotificationsModule, IncidentsModule],
  controllers: [EvidenceController],
  providers: [EvidenceService, StorageService],
})
export class EvidenceModule {}
