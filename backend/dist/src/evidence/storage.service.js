"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var StorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
let StorageService = StorageService_1 = class StorageService {
    configService;
    logger = new common_1.Logger(StorageService_1.name);
    client = null;
    bucket;
    constructor(configService) {
        this.configService = configService;
        this.bucket = this.configService.get('SUPABASE_EVIDENCE_BUCKET') ?? 'evidence';
    }
    getClient() {
        if (this.client)
            return this.client;
        const url = this.configService.get('SUPABASE_URL');
        const key = this.configService.get('SUPABASE_SERVICE_ROLE_KEY');
        if (!url || !key) {
            throw new common_1.InternalServerErrorException('File storage is not configured yet — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
        }
        this.client = (0, supabase_js_1.createClient)(url, key);
        return this.client;
    }
    async createSignedUploadUrl(path) {
        const { data, error } = await this.getClient()
            .storage.from(this.bucket)
            .createSignedUploadUrl(path);
        if (error) {
            this.logger.error(error.message);
            throw new common_1.InternalServerErrorException('Could not create an upload URL');
        }
        return data;
    }
    async createSignedDownloadUrl(path, expiresInSeconds = 300) {
        const { data, error } = await this.getClient()
            .storage.from(this.bucket)
            .createSignedUrl(path, expiresInSeconds);
        if (error) {
            this.logger.error(error.message);
            throw new common_1.InternalServerErrorException('Could not create a download URL');
        }
        return data.signedUrl;
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = StorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StorageService);
//# sourceMappingURL=storage.service.js.map