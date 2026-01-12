"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const MessagingController_1 = __importDefault(require("../../controllers/MessagingController"));
const api_validation_1 = require("../../validation/rules/api-validation");
const api_request_validator_1 = require("../../middleware/api-request-validator");
const MessagingEndpoints = express_1.default.Router();
// s3Upload(AwsS3AccessEndpoints.MESSAGING).fields([{ name: 'media', maxCount: 10 }])
//MessagingEndpoints.post('/media-message', s3Upload(AwsS3AccessEndpoints.MESSAGING).fields([{ name: 'media', maxCount: 10 }]), mediaMessageApiValidator, validateRequest, MessagingController.sendMediaMessage);
// Used when user shares an existing post
MessagingEndpoints.post('/share-post-message', [...api_validation_1.mediaMessageApiValidator, api_validation_1.postIDValidationRule], api_request_validator_1.validateRequest, MessagingController_1.default.sharingPostMediaMessage);
MessagingEndpoints.delete('/chat/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, MessagingController_1.default.deleteChat);
MessagingEndpoints.post('/export-chat/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, MessagingController_1.default.exportChat);
exports.default = MessagingEndpoints;
