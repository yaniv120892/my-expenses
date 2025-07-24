import winston from 'winston';
import Transport from 'winston-transport';
import fetch from 'node-fetch';

const logtailToken = process.env.LOGTAIL_TOKEN || '';
const logtailHost = process.env.LOGTAIL_HOST || '';
const logtailEndpoint = `https://${logtailHost}`;

async function logToLogtail(
  message: string,
  level: string = 'info',
  meta: any = {},
) {
  if (!logtailToken || !logtailHost) {
    return;
  }

  try {
    await fetch(logtailEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${logtailToken}`,
      },
      body: JSON.stringify({
        dt: new Date().toISOString(),
        level,
        message,
        ...meta,
      }),
    });
  } catch (err) {
    console.error('Error logging to Logtail:', err);
  }
}

const logFormat = winston.format.printf(
  ({ level, message, timestamp, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} ${level}: ${message} ${metaString}`;
  },
);

class LogtailHttpTransport extends Transport {
  log(info: any, callback: () => void) {
    setImmediate(() => {
      logToLogtail(info.message, info.level, info);
      callback();
    });
  }
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  format: winston.format.combine(winston.format.timestamp(), logFormat),
  transports: [
    new winston.transports.Console(), // Log to console
    new LogtailHttpTransport(), // Log to Logtail via HTTP
  ],
});

export const requestLogger = (req: any, res: any, next: any) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
};

export default logger;
