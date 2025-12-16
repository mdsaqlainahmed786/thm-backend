"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const AmenityController_1 = __importDefault(require("../../../controllers/booking/AmenityController"));
const api_validation_1 = require("../../../validation/rules/api-validation");
const api_request_validator_1 = require("../../../middleware/api-request-validator");
//FIXME More categorized like Food and Popular Amenities,Parking;
const AmenityEndpoints = express_1.default.Router();
AmenityEndpoints.get('/', AmenityController_1.default.index);
AmenityEndpoints.post('/', api_validation_1.createAmenityApiValidator, api_request_validator_1.validateRequest, AmenityController_1.default.store);
AmenityEndpoints.delete('/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, AmenityController_1.default.destroy);
AmenityEndpoints.put('/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, AmenityController_1.default.update);
AmenityEndpoints.get('/categories', AmenityController_1.default.categories);
exports.default = AmenityEndpoints;
