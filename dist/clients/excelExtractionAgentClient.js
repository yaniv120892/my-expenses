"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.excelExtractionAgentClient = exports.ExcelExtractionAgentClient = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("../utils/logger"));
const webhookAuth_1 = require("../utils/webhookAuth");
class ExcelExtractionAgentClient {
    constructor() {
        this.serviceUrl = process.env.EXCEL_EXTRACTION_AGENT_URL || '';
        this.webhookBaseUrl = process.env.API_URL || '';
        if (!this.serviceUrl) {
            throw new Error('EXCEL_EXTRACTION_AGENT_URL environment variable is required');
        }
        if (!this.webhookBaseUrl) {
            throw new Error('API_URL environment variable is required for webhook base url');
        }
    }
    /**
     * Submit an extraction request to the excel-extraction-service
     */
    async submitExtractionRequest(request) {
        try {
            const timestamp = Date.now();
            const token = (0, webhookAuth_1.generateWebhookToken)(request.userId, timestamp);
            const webhookUrl = `${this.webhookBaseUrl}/excel-extraction-agent/webhook?token=${encodeURIComponent(token)}&userId=${encodeURIComponent(request.userId)}&timestamp=${timestamp}`;
            const payload = {
                fileUrl: request.fileUrl,
                filename: request.filename,
                userId: request.userId,
                webhookUrl,
                options: request.options || {
                    confidenceThreshold: 0.7,
                    maxRetries: 3,
                    includeRawData: false,
                },
            };
            logger_1.default.info('Submitting extraction request', {
                filename: request.filename,
                userId: request.userId,
                fileUrl: request.fileUrl.substring(0, 100),
                webhookUrlPreview: this.webhookBaseUrl,
            });
            const client = axios_1.default.create({
                baseURL: this.serviceUrl,
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const response = await client.post('/api/extract', payload);
            logger_1.default.info('Extraction request submitted successfully', {
                requestId: response.data.requestId,
                status: response.data.status,
                userId: request.userId,
            });
            return response.data;
        }
        catch (error) {
            logger_1.default.error('Failed to submit extraction request', {
                error: this.formatError(error),
                filename: request.filename,
                userId: request.userId,
            });
            throw this.handleError(error, 'Failed to submit extraction request');
        }
    }
    /**
     * Get the status of an extraction request
     */
    async getExtractionStatus(requestId) {
        try {
            logger_1.default.debug('Fetching extraction status', { requestId });
            const client = axios_1.default.create({
                baseURL: this.serviceUrl,
                timeout: 5000,
            });
            const response = await client.get(`/api/status/${requestId}`);
            logger_1.default.debug('Extraction status retrieved', {
                requestId,
                status: response.data.status,
            });
            return response.data;
        }
        catch (error) {
            logger_1.default.error('Failed to get extraction status', {
                error: this.formatError(error),
                requestId,
            });
            throw this.handleError(error, 'Failed to get extraction status');
        }
    }
    /**
     * Check if the extraction service is healthy
     */
    async checkHealth() {
        try {
            const client = axios_1.default.create({
                baseURL: this.serviceUrl,
                timeout: 5000,
            });
            const response = await client.get('/api/health');
            const isHealthy = response.status === 200;
            logger_1.default.debug('Excel extraction service health check', {
                healthy: isHealthy,
                status: response.status,
            });
            return isHealthy;
        }
        catch (error) {
            logger_1.default.warn('Excel extraction service health check failed', {
                error: this.formatError(error),
            });
            return false;
        }
    }
    formatError(error) {
        var _a, _b;
        if (axios_1.default.isAxiosError(error)) {
            const axiosError = error;
            return {
                message: axiosError.message,
                code: axiosError.code,
                status: (_a = axiosError.response) === null || _a === void 0 ? void 0 : _a.status,
                data: (_b = axiosError.response) === null || _b === void 0 ? void 0 : _b.data,
            };
        }
        if (error instanceof Error) {
            return {
                message: error.message,
                stack: error.stack,
            };
        }
        return error;
    }
    handleError(error, defaultMessage) {
        var _a, _b, _c, _d;
        if (axios_1.default.isAxiosError(error)) {
            const axiosError = error;
            const responseData = (_a = axiosError.response) === null || _a === void 0 ? void 0 : _a.data;
            if (responseData === null || responseData === void 0 ? void 0 : responseData.message) {
                return new Error(`${defaultMessage}: ${responseData.message}`);
            }
            if (((_b = axiosError.response) === null || _b === void 0 ? void 0 : _b.status) === 400) {
                return new Error(`${defaultMessage}: Invalid request`);
            }
            if (((_c = axiosError.response) === null || _c === void 0 ? void 0 : _c.status) === 404) {
                return new Error(`${defaultMessage}: Resource not found`);
            }
            if (((_d = axiosError.response) === null || _d === void 0 ? void 0 : _d.status) === 503) {
                return new Error(`${defaultMessage}: Service unavailable`);
            }
            return new Error(`${defaultMessage}: ${axiosError.message} (${axiosError.code})`);
        }
        if (error instanceof Error) {
            return new Error(`${defaultMessage}: ${error.message}`);
        }
        return new Error(defaultMessage);
    }
}
exports.ExcelExtractionAgentClient = ExcelExtractionAgentClient;
exports.excelExtractionAgentClient = new ExcelExtractionAgentClient();
