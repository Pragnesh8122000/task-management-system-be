/**
 * To Use:
 * 1) Import this file and as logger eg: import logger from './logger'
 * 2) Use logger.info for all info, logger.warn for all warnings and logger.error for all errors.
 * 3) For critical errors only, use logger.error other wise use warn or info
 * 4) If something fails but is manageable, use warn to let the auditor know what needs attention
 * 5) If something is just for information such as a new entry was created in the DB, use info
 * 6) Use logger.error that needs attention and should be fixed immediately for the app to function properly in production
 * 7) logger.http is used by morgan to log http requests, don't use it
 * 8) In development, you can use logger.debug, logger.verbose and logger.silly. Use these only for development, if anything should be a part of the production logs, it should be logged using logger.info, logger.warn or logger.error
 * 9) Log files will be stored inside the logs folder and will be updated daily. They will not be pushed to the git repo
 */

import winston from "winston";
import stripColors from "cli-color";
import dotenv from "dotenv";

dotenv.config();

// Default exported function that will set up Winston for logging
// Getting the required function from the format module
const { combine, timestamp, json, printf } = winston.format;

const customFormat = printf(({ level, message, timestamp:ts }) => {
    // Strip color codes from the message
    const cleanMessage = stripColors(message);
    return JSON.stringify({ level, message: cleanMessage, ts });
});

// Create a logger using winston
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: combine(
        timestamp({
            format: "YYYY-MM-DD hh:mm:ss.SSS A",
        }),
        customFormat,
    ),
    transports: [
        new winston.transports.File({
            filename: "app-info.log",
            level: "info",
            format: combine(
                timestamp({
                    format: "YYYY-MM-DD hh:mm:ss.SSS A",
                }),
                printf(
                    (info) =>
                        `[${info.timestamp}] ${info.level}: ${info.message}\n`,
                ), // Add \n at the end
            ),
        }),
    ],
});

// If environment is not production, then log all levels to the console as well
if (process.env.NODE_ENV !== "production") {
    logger.add(
        new winston.transports.Console({
            level: "silly",
            format: winston.format.simple(),
        }),
        json(),
    );
}

const disableLogging = () => {
    logger.transports.forEach((transport) => {
        transport.silent = true;
    });
};

// Check for an environment variable to disable logging
if (process.env.DISABLE_LOGGING === "YES") {
    disableLogging();
}

export default logger;