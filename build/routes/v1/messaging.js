"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const MessagingController_1 = __importDefault(require("../../controllers/MessagingController"));
const file_uploading_1 = require("../../middleware/file-uploading");
const api_validation_1 = require("../../validation/rules/api-validation");
const api_request_validator_1 = require("../../middleware/api-request-validator");
const MessagingEndpoints = express_1.default.Router();
// s3Upload(AwsS3AccessEndpoints.MESSAGING).fields([{ name: 'media', maxCount: 10 }])
MessagingEndpoints.post('/media-message', file_uploading_1.diskUpload.fields([{ name: 'media', maxCount: 10 }]), api_validation_1.mediaMessageApiValidator, api_request_validator_1.validateRequest, MessagingController_1.default.sendMediaMessage);
MessagingEndpoints.delete('/chat/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, MessagingController_1.default.deleteChat);
MessagingEndpoints.post('/export-chat/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, MessagingController_1.default.exportChat);
exports.default = MessagingEndpoints;
