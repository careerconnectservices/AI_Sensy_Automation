const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');

const customFormat = format.printf(({ level, message, timestamp, meta }) => {
    let logMessage = `${timestamp} : ${level} : ${message}`;
    if (meta) {
        logMessage += ` : ${JSON.stringify(meta)}`;
    }
    return logMessage;
});

const logger = createLogger({
    level: "info",
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }), // Handle logging of error stack traces
        customFormat
    ),
    transports: [
        new transports.Console(),
        new transports.DailyRotateFile({
            filename: 'combined-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            dirname: 'logs',
            maxSize: '20m',
            maxFiles: '1d', // Retain logs for 1 days
            zippedArchive: true // Enable log compression
        })
    ],
    exceptionHandlers: [
        new transports.DailyRotateFile({
            filename: 'exceptions-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            dirname: 'logs',
            maxSize: '20m',
            maxFiles: '3d', // Retain logs for 3 days
            zippedArchive: true // Enable log compression
        })
    ]
});

module.exports = logger;
