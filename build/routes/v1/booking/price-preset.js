"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const api_validation_1 = require("../../../validation/rules/api-validation");
const api_request_validator_1 = require("../../../middleware/api-request-validator");
const PricePresetController_1 = __importDefault(require("../../../controllers/booking/PricePresetController"));
const PricePresetEndpoints = express_1.default.Router();
PricePresetEndpoints.get('/', PricePresetController_1.default.index);
// PricePresetEndpoints.get('/:id', PricePresetController.show);
PricePresetEndpoints.post('/', api_validation_1.createPricePresetApiValidator, api_request_validator_1.validateRequest, PricePresetController_1.default.store);
PricePresetEndpoints.put('/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, PricePresetController_1.default.update);
PricePresetEndpoints.delete("/:id", [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, PricePresetController_1.default.destroy);
exports.default = PricePresetEndpoints;
