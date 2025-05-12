import winston from 'winston';

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
  ],
});

export const requestLogger = (req: any, res: any, next: any) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
};

export default logger;
