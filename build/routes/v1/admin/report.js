"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ReportController_1 = __importDefault(require("../../../controllers/ReportController"));
const api_validation_1 = require("../../../validation/rules/api-validation");
const api_request_validator_1 = require("../../../middleware/api-request-validator");
const ReportEndpoints = express_1.default.Router();
ReportEndpoints.get('/', ReportController_1.default.index);
ReportEndpoints.delete('/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, ReportController_1.default.destroy);
exports.default = ReportEndpoints;
