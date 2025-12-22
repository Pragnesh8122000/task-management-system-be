import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const enMessagesPath = path.resolve(
    __dirname,
    "../common/languages/enMessages.json",
);
const enMessages = JSON.parse(fs.readFileSync(enMessagesPath, "utf-8"));
// import enMessages from "../common/languages/enMessages.json" assert { type: "json" };

/**
 * To replace msg for api response
 * @param {string} textMsg - original message string with {field1} {field2}
 * @param {Object} replaceWith - Object pattern {field1: value1, field2: value2,...}
 * @returns {string} returns the new message after replacing fields with values in it
 */
const replaceFieldText = (textMsg, replaceWith) => {
    if (Object.keys(replaceWith).length > 0) {
        for (const field in replaceWith) {
            if (replaceWith.hasOwnProperty(field)) {
                const regex = new RegExp("\\{" + field + "\\}", "g");
                textMsg = textMsg.replace(regex, replaceWith[field]);
            }
        }
    }
    return textMsg;
};
/**
 * sends the response to client
 * @param {Object} req - The request object.
 * @param {Object} res - The response object..
 * @returns {Promise<void>} returns response to client
 */
export const sendResponse = (req, res, next) => {
    res.sendResponse = (
        success,
        statusCode,
        messageCode,
        data,
        replaceMsgObj = {},
    ) => {
        const messages = enMessages;
        let message = messages[messageCode] || enMessages[messageCode];
        //only if replaceObj pass
        if (Object.keys(replaceMsgObj).length > 0) {
            message = replaceFieldText(message, replaceMsgObj);
        }
        const responseData = {
            success,
            message: message || messageCode,
        };
        if (data && Object.keys(data).length > 0 && !Array.isArray(responseData.message)) {
            responseData.data = convertKeysToSnakeCase(data);
        }
        res.status(statusCode).json(responseData);
    };
    return next();
};


/**
 * Convert camelCase string to snake_case
 * @param {string} str
 * @returns {string}
 */
function camelToSnakeCase(str) {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

/**
 * Recursively convert all keys of an object (or array) from camelCase to snake_case
 * @param {any} input
 * @returns {any}
 */
function convertKeysToSnakeCase(input) {
    if (input instanceof Date) {
        return input;
    }

    // Check if it's an ObjectId (Mongoose or MongoDB)
    if (input && input._bsontype === 'ObjectID' || (input && typeof input.toString === 'function' && /^[0-9a-fA-F]{24}$/.test(input.toString()))) {
        return input.toString();
    }

    if (Array.isArray(input)) {
        return input.map(item => convertKeysToSnakeCase(item));
    } else if (input !== null && typeof input === 'object') {
        // Only traverse plain objects
        if (input.constructor && input.constructor.name !== 'Object') {
            return input;
        }
        return Object.keys(input).reduce((acc, key) => {
            const newKey = camelToSnakeCase(key);
            acc[newKey] = convertKeysToSnakeCase(input[key]);
            return acc;
        }, {});
    }
    return input;
}