"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMulterError = exports.wrapMulterMiddleware = void 0;
const multer_1 = require("multer");
const response_1 = require("../utils/response");
const error_1 = require("../utils/response-message/error");
/**
 * Wrapper middleware to catch multer errors and handle them properly
 * This wraps multer middleware to catch errors during upload
 */
function wrapMulterMiddleware(multerMiddleware) {
    return (req, res, next) => {
        multerMiddleware(req, res, (err) => {
            if (err) {
                return handleMulterError(err, req, res, next);
            }
            next();
        });
    };
}
exports.wrapMulterMiddleware = wrapMulterMiddleware;
/**
 * Middleware to handle Multer errors (file upload errors)
 * This catches errors from multer middleware and returns proper error responses
 */
function handleMulterError(err, req, res, next) {
    console.error("File Upload Error:", {
        code: err.code,
        message: err.message,
        field: err.field,
        name: err.name,
        stack: err.stack
    });
    if (err instanceof multer_1.MulterError) {
        let errorMessage = "File upload error";
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                errorMessage = `File size exceeds the maximum allowed size of 500MB`;
                break;
            case 'LIMIT_FILE_COUNT':
                errorMessage = `Too many files. Maximum allowed is ${err.limit}`;
                break;
            case 'LIMIT_UNEXPECTED_FILE':
                errorMessage = `Unexpected file field: ${err.field}`;
                break;
            case 'LIMIT_PART_COUNT':
                errorMessage = "Too many parts in the multipart request";
                break;
            case 'LIMIT_FIELD_KEY':
                errorMessage = "Field name too long";
                break;
            case 'LIMIT_FIELD_VALUE':
                errorMessage = "Field value too long";
                break;
            case 'LIMIT_FIELD_COUNT':
                errorMessage = "Too many fields";
                break;
            default:
                errorMessage = err.message || "File upload error";
        }
        return res.status(400).json((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest(errorMessage), errorMessage));
    }
    // Handle other file-related errors (e.g., from fileFilter, S3 upload failures)
    if (err.status === 400 && err.message) {
        return res.status(400).json((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest(err.message), err.message));
    }
    // Handle S3/AWS errors
    if (err.name === 'S3ServiceException' || err.name === 'NoSuchBucket' || err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
        const errorMessage = "Failed to upload file to storage. Please try again or contact support.";
        console.error("S3 Upload Error:", err);
        return res.status(500).json((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest(errorMessage), errorMessage));
    }
    // If it's not a multer error, pass it to the next error handler
    next(err);
}
exports.handleMulterError = handleMulterError;
