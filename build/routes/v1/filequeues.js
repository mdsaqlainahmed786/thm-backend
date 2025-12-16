"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const api_validation_1 = require("../../validation/rules/api-validation");
const api_request_validator_1 = require("../../middleware/api-request-validator");
const FileQueueController_1 = __importDefault(require("../../controllers/FileQueueController"));
const FileQueueEndpoints = express_1.default.Router();
FileQueueEndpoints.get('/', FileQueueController_1.default.index);
FileQueueEndpoints.put('/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, FileQueueController_1.default.update);
exports.default = FileQueueEndpoints;
