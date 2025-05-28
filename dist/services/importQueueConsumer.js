"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = require("aws-sdk");
const importService_1 = require("./importService");
const logger_1 = __importDefault(require("../utils/logger"));
class ImportQueueConsumer {
    constructor() {
        this.isRunning = false;
        this.sqs = new aws_sdk_1.SQS({
            region: process.env.QUEUE_AWS_REGION,
        });
        this.queueUrl = process.env.IMPORT_QUEUE_URL || '';
    }
    async start() {
        if (this.isRunning) {
            return;
        }
        this.isRunning = true;
        logger_1.default.info('Starting import queue consumer');
        while (this.isRunning) {
            try {
                const messages = await this.receiveMessages();
                for (const message of messages) {
                    await this.processMessage(message);
                }
                // Small delay to prevent tight loop
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            catch (error) {
                logger_1.default.error('Error processing messages', error);
            }
        }
    }
    stop() {
        this.isRunning = false;
        logger_1.default.info('Stopping import queue consumer');
    }
    async receiveMessages() {
        try {
            const result = await this.sqs
                .receiveMessage({
                QueueUrl: this.queueUrl,
                MaxNumberOfMessages: 1,
                WaitTimeSeconds: 20,
            })
                .promise();
            return result.Messages || [];
        }
        catch (error) {
            logger_1.default.error('Failed to receive messages', error);
            return [];
        }
    }
    async processMessage(message) {
        try {
            if (!message.Body) {
                throw new Error('Empty message body');
            }
            const importMessage = JSON.parse(message.Body);
            await importService_1.importService.processImport(importMessage.fileUrl, importMessage.importType, importMessage.userId);
            await this.deleteMessage(message);
        }
        catch (error) {
            logger_1.default.error('Failed to process message', error);
            // Don't delete the message to allow retry
        }
    }
    async deleteMessage(message) {
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
        }
        catch (error) {
            logger_1.default.error('Failed to delete message', error);
        }
    }
}
exports.default = new ImportQueueConsumer();
