import winston from 'winston';
import TransportStream from 'winston-transport';
import https from 'https';

const logtailToken = process.env.LOGTAIL_TOKEN || '';
const logtailHost = process.env.LOGTAIL_HOST || 'in.logtail.com';

class LogtailJsonTransport extends TransportStream {
  log(info: any, callback: () => void) {
    setImmediate(() => this.emit('logged', info));
    if (!logtailToken) return callback();

    // Prepare the log object
    const log = {
      message: info.message,
      level: info.level,
      ...info,
    };
    const data = JSON.stringify(log);
    const options = {
      hostname: logtailHost,
      port: 443,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${logtailToken}`,
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = https.request(options, (res) => {
      res.on('data', () => {}); 
      res.on('end', () => {});
    });
    req.on('error', (err) => {
      console.error('Error logging to Logtail', err.message);
    });
    req.write(data);
    req.end();
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
  level: process.env.LOG_LEVEL || 'debug',
  format: winston.format.combine(winston.format.timestamp(), logFormat),
  transports: [
    new winston.transports.Console(), // Log to console
    new LogtailJsonTransport(), 
  ],
});

export const requestLogger = (req: any, res: any, next: any) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
};

export default logger;
