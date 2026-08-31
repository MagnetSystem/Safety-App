import { ConfigService } from '@nestjs/config';
export declare class StorageService {
    private readonly configService;
    private readonly logger;
    private client;
    private readonly bucket;
    constructor(configService: ConfigService);
    private getClient;
    createSignedUploadUrl(path: string): Promise<{
        signedUrl: string;
        token: string;
        path: string;
    }>;
    createSignedDownloadUrl(path: string, expiresInSeconds?: number): Promise<string>;
}
