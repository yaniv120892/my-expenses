import { SQS } from 'aws-sdk';
import { ImportQueueMessage } from '../types/import';
import { importService } from './importService';
import logger from '../utils/logger';

class ImportQueueConsumer {
  private sqs: SQS;
  private queueUrl: string;
  private isRunning: boolean = false;

  constructor() {
    this.sqs = new SQS({
      region: process.env.QUEUE_AWS_REGION,
    });
    this.queueUrl = process.env.IMPORT_QUEUE_URL || '';
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    logger.info('Starting import queue consumer');

    while (this.isRunning) {
      try {
        const messages = await this.receiveMessages();

        for (const message of messages) {
          await this.processMessage(message);
        }

        // Small delay to prevent tight loop
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error: any) {
        logger.error('Error processing messages', error);
      }
    }
  }

  stop(): void {
    this.isRunning = false;
    logger.info('Stopping import queue consumer');
  }

  private async receiveMessages(): Promise<SQS.Message[]> {
    try {
      const result = await this.sqs
        .receiveMessage({
          QueueUrl: this.queueUrl,
          MaxNumberOfMessages: 1,
          WaitTimeSeconds: 20,
        })
        .promise();

      return result.Messages || [];
    } catch (error: any) {
      logger.error('Failed to receive messages', error);
      return [];
    }
  }

  private async processMessage(message: SQS.Message): Promise<void> {
    try {
      if (!message.Body) {
        throw new Error('Empty message body');
      }

      const importMessage: ImportQueueMessage = JSON.parse(message.Body);
      await importService.processImport(
        importMessage.fileUrl,
        importMessage.importType,
        importMessage.userId,
      );
      await this.deleteMessage(message);
    } catch (error: any) {
      logger.error('Failed to process message', error);
      // Don't delete the message to allow retry
    }
  }

  private async deleteMessage(message: SQS.Message): Promise<void> {
    try {
      if (!message.ReceiptHandle) {
        throw new Error('No receipt handle');
      }

      await this.sqs
        .deleteMessage({
          QueueUrl: this.queueUrl,
          ReceiptHandle: message.ReceiptHandle,
        })
        .promise();
    } catch (error: any) {
      logger.error('Failed to delete message', error);
    }
  }
}

export default new ImportQueueConsumer();
