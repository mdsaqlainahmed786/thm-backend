"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const api_validation_1 = require("../../../validation/rules/api-validation");
const api_request_validator_1 = require("../../../middleware/api-request-validator");
const PromoCodeController_1 = __importDefault(require("../../../controllers/admin/PromoCodeController"));
const PromoCodeEndpoints = express_1.default.Router();
PromoCodeEndpoints.get('/', PromoCodeController_1.default.index);
PromoCodeEndpoints.post('/', api_validation_1.createPromoCodeApiValidator, api_request_validator_1.validateRequest, PromoCodeController_1.default.store);
PromoCodeEndpoints.put('/:id', PromoCodeController_1.default.update);
PromoCodeEndpoints.delete('/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, PromoCodeController_1.default.destroy);
exports.default = PromoCodeEndpoints;
