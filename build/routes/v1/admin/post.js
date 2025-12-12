"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const api_validation_1 = require("../../../validation/rules/api-validation");
const api_request_validator_1 = require("../../../middleware/api-request-validator");
const PostController_1 = __importDefault(require("../../../controllers/admin/PostController"));
const PostEndpoints = express_1.default.Router();
PostEndpoints.get('/', PostController_1.default.index);
PostEndpoints.put('/:id', PostController_1.default.update);
PostEndpoints.delete('/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, PostController_1.default.destroy);
exports.default = PostEndpoints;
