"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const SubscriptionPlanController_1 = __importDefault(require("../../../controllers/admin/SubscriptionPlanController"));
const api_validation_1 = require("../../../validation/rules/api-validation");
const api_request_validator_1 = require("../../../middleware/api-request-validator");
const SubscriptionPlanEndpoints = express_1.default.Router();
SubscriptionPlanEndpoints.get('/', SubscriptionPlanController_1.default.index);
SubscriptionPlanEndpoints.get('/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, SubscriptionPlanController_1.default.show);
SubscriptionPlanEndpoints.post('/', api_validation_1.createSubscriptionPlanApiValidator, api_request_validator_1.validateRequest, SubscriptionPlanController_1.default.store);
SubscriptionPlanEndpoints.delete('/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, SubscriptionPlanController_1.default.destroy);
SubscriptionPlanEndpoints.put('/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, SubscriptionPlanController_1.default.update);
exports.default = SubscriptionPlanEndpoints;
