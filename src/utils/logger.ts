import winston from 'winston';
import { Logtail } from '@logtail/node';
import TransportStream from 'winston-transport';

const logtailToken = process.env.LOGTAIL_TOKEN;
console.log('logtailToken', logtailToken);
const logtail = new Logtail(logtailToken ?? '');

// Custom Winston transport for Logtail using winston-transport
class LogtailTransport extends TransportStream {
  log(info: any, callback: () => void) {
    setImmediate(() => this.emit('logged', info));
    if (logtail) {
      logtail.log(info).catch(() => {
        console.error('Error logging to Logtail', info);
      }); // Ignore errors
    }
    callback();
  }
}

const logFormat = winston.format.printf(
  ({ level, message, timestamp, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} ${level}: ${message} ${metaString}`;
  },
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), logFormat),
  transports: [
    new winston.transports.Console(), // Log to console
    ...(logtail ? [new LogtailTransport()] : []), // Log to Logtail if token exists
  ],
});

export const requestLogger = (req: any, res: any, next: any) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
};

export default logger;
