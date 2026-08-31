import { IncidentCategory, ReportType } from '@prisma/client';
export declare class CreateComplaintDto {
    type: ReportType;
    category: IncidentCategory;
    description: string;
    incidentDate?: string;
    location?: string;
    suspectedStudents?: string;
    witnesses?: string;
    gpsLat?: number;
    gpsLng?: number;
    gpsAccuracy?: number;
    deviceInfo?: string;
}
