import winston from 'winston';
import 'winston-daily-rotate-file'; 
import fs from 'fs';
import path from 'path';

const { combine, timestamp, printf, errors } = winston.format;

// Ensure the 'logs' directory exists
const logsDir = path.join( 'logs');

if (!fs.existsSync(logsDir)) {
 
  fs.mkdirSync(logsDir, { recursive: true });  
}

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  if (stack) {
    return `${timestamp} [${level}]: ${message}\n${stack}`;
  }
  return `${timestamp} [${level}]: ${message}`;
});

// Define the daily rotate file transport
const dailyRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logsDir, 'app-%DATE%.log'), 
  datePattern: 'YYYY-MM-DD',                      
  maxSize: '20m',                                
  maxFiles: '30d',                               
  level: 'info',                                  
});

// Create the logger instance
const logger = winston.createLogger({
  level: 'info', 
  format: combine(
    timestamp(),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
  
    new winston.transports.Console({
      format: combine(
        winston.format.colorize(), 
        winston.format.simple()
      ),
    }),
  
    dailyRotateTransport,
  ],
});

export default logger;
