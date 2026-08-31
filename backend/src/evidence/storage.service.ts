import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Thin wrapper around Supabase Storage (private bucket). The backend never
 * touches raw file bytes — it only issues short-lived signed URLs that clients
 * upload to / download from directly.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private client: SupabaseClient | null = null;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('SUPABASE_EVIDENCE_BUCKET') ?? 'evidence';
  }

  private getClient(): SupabaseClient {
    if (this.client) return this.client;

    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) {
      throw new InternalServerErrorException(
        'File storage is not configured yet — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
      );
    }
    this.client = createClient(url, key);
    return this.client;
  }

  async createSignedUploadUrl(path: string) {
    const { data, error } = await this.getClient()
      .storage.from(this.bucket)
      .createSignedUploadUrl(path);
    if (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException('Could not create an upload URL');
    }
    return data; // { signedUrl, path, token }
  }

  async createSignedDownloadUrl(path: string, expiresInSeconds = 300) {
    const { data, error } = await this.getClient()
      .storage.from(this.bucket)
      .createSignedUrl(path, expiresInSeconds);
    if (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException('Could not create a download URL');
    }
    return data.signedUrl;
  }
}
