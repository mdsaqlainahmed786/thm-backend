"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ContactUsController_1 = __importDefault(require("../../controllers/ContactUsController"));
const api_validation_1 = require("../../validation/rules/api-validation");
const api_request_validator_1 = require("../../middleware/api-request-validator");
const authenticate_1 = __importStar(require("../../middleware/authenticate"));
const api_validation_2 = require("../../validation/rules/api-validation");
const ContactUsEndpoints = express_1.default.Router();
ContactUsEndpoints.get('/', authenticate_1.default, authenticate_1.isAdministrator, ContactUsController_1.default.index);
ContactUsEndpoints.post('/', api_validation_1.createContactApiValidator, api_request_validator_1.validateRequest, ContactUsController_1.default.store);
ContactUsEndpoints.put('/:id', authenticate_1.default, authenticate_1.isAdministrator, [api_validation_2.paramIDValidationRule], api_request_validator_1.validateRequest, ContactUsController_1.default.update);
ContactUsEndpoints.delete('/:id', authenticate_1.default, authenticate_1.isAdministrator, [api_validation_2.paramIDValidationRule], api_request_validator_1.validateRequest, ContactUsController_1.default.destroy);
exports.default = ContactUsEndpoints;
