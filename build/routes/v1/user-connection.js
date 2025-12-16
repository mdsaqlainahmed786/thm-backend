"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const UserConnectionController_1 = __importDefault(require("../../controllers/UserConnectionController"));
const api_request_validator_1 = require("../../middleware/api-request-validator");
const api_validation_1 = require("../../validation/rules/api-validation");
const UserConnectionEndpoints = express_1.default.Router();
UserConnectionEndpoints.post('/follow/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, UserConnectionController_1.default.sendFollowRequest);
UserConnectionEndpoints.post('/follow-back/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, UserConnectionController_1.default.followBack);
UserConnectionEndpoints.post('/accept-follow/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, UserConnectionController_1.default.acceptFollow);
UserConnectionEndpoints.post('/reject-follow/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, UserConnectionController_1.default.rejectFollow);
UserConnectionEndpoints.delete('/unfollow/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, UserConnectionController_1.default.unFollow);
UserConnectionEndpoints.get('/follower/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, UserConnectionController_1.default.follower);
UserConnectionEndpoints.get('/following/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, UserConnectionController_1.default.following);
exports.default = UserConnectionEndpoints;
