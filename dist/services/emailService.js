"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = __importDefault(require("../utils/logger"));
class EmailService {
    constructor() {
        this.transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    async send({ to, subject, text, html, }) {
        try {
            await this.transporter.verify();
            await this.transporter.sendMail({
                from: process.env.SMTP_FROM,
                to,
                subject,
                text,
                html,
            });
        }
        catch (error) {
            logger_1.default.error('Failed to send email', error, {
                to,
                subject,
                text,
            });
            throw new Error('Failed to send email');
        }
    }
}
exports.default = new EmailService();
