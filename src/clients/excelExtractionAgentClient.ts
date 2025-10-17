import axios, { AxiosInstance, AxiosError } from 'axios';
import logger from '../utils/logger';
import { generateWebhookToken } from '../utils/webhookAuth';
import {
  SubmitExtractionRequest,
  SubmitExtractionResponse,
  ExtractionStatusResponse,
} from './excelExtractionAgentClientTypes';

export class ExcelExtractionAgentClient {
  private webhookBaseUrl: string;
  private serviceUrl: string;

  constructor() {
    this.serviceUrl = process.env.EXCEL_EXTRACTION_AGENT_URL || '';
    this.webhookBaseUrl = process.env.API_URL || '';

    if (!this.serviceUrl) {
      throw new Error(
        'EXCEL_EXTRACTION_AGENT_URL environment variable is required',
      );
    }

    if (!this.webhookBaseUrl) {
      throw new Error(
        'API_URL environment variable is required for webhook base url',
      );
    }
  }

  /**
   * Submit an extraction request to the excel-extraction-service
   */
  async submitExtractionRequest(
    request: SubmitExtractionRequest,
  ): Promise<SubmitExtractionResponse> {
    try {
      const timestamp = Date.now();
      const token = generateWebhookToken(request.userId, timestamp);

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

      logger.info('Submitting extraction request', {
        filename: request.filename,
        userId: request.userId,
        fileUrl: request.fileUrl.substring(0, 100),
        webhookUrlPreview: this.webhookBaseUrl,
      });

      const client = axios.create({
        baseURL: this.serviceUrl,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await client.post<SubmitExtractionResponse>(
        '/api/extract',
        payload,
      );

      logger.info('Extraction request submitted successfully', {
        requestId: response.data.requestId,
        status: response.data.status,
        userId: request.userId,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to submit extraction request', {
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
  async getExtractionStatus(
    requestId: string,
  ): Promise<ExtractionStatusResponse> {
    try {
      logger.debug('Fetching extraction status', { requestId });

      const client = axios.create({
        baseURL: this.serviceUrl,
        timeout: 5000,
      });

      const response = await client.get<ExtractionStatusResponse>(
        `/api/status/${requestId}`,
      );

      logger.debug('Extraction status retrieved', {
        requestId,
        status: response.data.status,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to get extraction status', {
        error: this.formatError(error),
        requestId,
      });

      throw this.handleError(error, 'Failed to get extraction status');
    }
  }

  /**
   * Check if the extraction service is healthy
   */
  async checkHealth(): Promise<boolean> {
    try {
      const client = axios.create({
        baseURL: this.serviceUrl,
        timeout: 5000,
      });

      const response = await client.get('/api/health');

      const isHealthy = response.status === 200;
      logger.debug('Excel extraction service health check', {
        healthy: isHealthy,
        status: response.status,
      });

      return isHealthy;
    } catch (error) {
      logger.warn('Excel extraction service health check failed', {
        error: this.formatError(error),
      });
      return false;
    }
  }

  private formatError(error: unknown): any {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      return {
        message: axiosError.message,
        code: axiosError.code,
        status: axiosError.response?.status,
        data: axiosError.response?.data,
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

  private handleError(error: unknown, defaultMessage: string): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const responseData = axiosError.response?.data as any;

      if (responseData?.message) {
        return new Error(`${defaultMessage}: ${responseData.message}`);
      }

      if (axiosError.response?.status === 400) {
        return new Error(`${defaultMessage}: Invalid request`);
      }

      if (axiosError.response?.status === 404) {
        return new Error(`${defaultMessage}: Resource not found`);
      }

      if (axiosError.response?.status === 503) {
        return new Error(`${defaultMessage}: Service unavailable`);
      }

      return new Error(
        `${defaultMessage}: ${axiosError.message} (${axiosError.code})`,
      );
    }

    if (error instanceof Error) {
      return new Error(`${defaultMessage}: ${error.message}`);
    }

    return new Error(defaultMessage);
  }
}

export const excelExtractionAgentClient = new ExcelExtractionAgentClient();
