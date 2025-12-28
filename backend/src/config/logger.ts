/**
 * Winston Logger Configuration
 * Structured logging for the application
 */

import winston from 'winston';
import { config } from './index.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
    let log = `${timestamp} [${level}]: ${message}`;

    // Add stack trace for errors
    if (stack) {
        log += `\n${stack}`;
    }

    // Add metadata if present
    if (Object.keys(metadata).length > 0) {
        log += ` ${JSON.stringify(metadata)}`;
    }

    return log;
});

// Create logger instance
export const logger = winston.createLogger({
    level: config.logging.level,
    format: combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
    ),
    defaultMeta: { service: 'n8n-saas-backend' },
    transports: [
        // Console transport
        new winston.transports.Console({
            format: combine(
                colorize({ all: true }),
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                logFormat
            ),
        }),

        // File transport for errors (production only)
        ...(config.isProduction
            ? [
                new winston.transports.File({
                    filename: 'logs/error.log',
                    level: 'error',
                    maxsize: 5242880, // 5MB
                    maxFiles: 5,
                }),
                new winston.transports.File({
                    filename: 'logs/combined.log',
                    maxsize: 5242880, // 5MB
                    maxFiles: 5,
                }),
            ]
            : []),
    ],
});

// Export a stream for Morgan HTTP logging
export const loggerStream = {
    write: (message: string) => {
        logger.info(message.trim());
    },
};
