"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
const response_1 = require("../utils/response");
const error_1 = require("../utils/response-message/error");
function validateRequest(request, response, next) {
    const error = (0, express_validator_1.validationResult)(request);
    if (!error.isEmpty()) {
        let extractedErrors = null;
        error.array({ onlyFirstError: true }).map(err => {
            // extractedErrors = { [err.param]: err.msg }
            extractedErrors = err.msg;
            console.log(err);
        });
        return response.json((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest(extractedErrors !== null && extractedErrors !== void 0 ? extractedErrors : error_1.ErrorMessage.BAD_REQUEST, error), extractedErrors !== null && extractedErrors !== void 0 ? extractedErrors : error_1.ErrorMessage.BAD_REQUEST));
    }
    next();
}
exports.validateRequest = validateRequest;
