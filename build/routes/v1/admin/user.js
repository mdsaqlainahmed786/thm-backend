"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const UserController_1 = __importDefault(require("../../../controllers/admin/UserController"));
const api_validation_1 = require("../../../validation/rules/api-validation");
const api_request_validator_1 = require("../../../middleware/api-request-validator");
const UserEndpoints = express_1.default.Router();
UserEndpoints.get('/', UserController_1.default.index);
UserEndpoints.get('/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, UserController_1.default.show);
UserEndpoints.put('/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, UserController_1.default.update);
UserEndpoints.post('/add-admin', api_validation_1.addAdminApiValidator, api_request_validator_1.validateRequest, UserController_1.default.addAdmin);
// UserEndpoints.delete('/account', UserController.deleteAccount);
// UserEndpoints.patch('/account/disable', UserController.deactivateAccount);
exports.default = UserEndpoints;
