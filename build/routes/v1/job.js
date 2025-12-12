"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const JobController_1 = __importDefault(require("../../controllers/JobController"));
const api_validation_1 = require("../../validation/rules/api-validation");
const api_request_validator_1 = require("../../middleware/api-request-validator");
const JobEndpoints = express_1.default.Router();
JobEndpoints.post('/', api_validation_1.createJobApiValidator, api_request_validator_1.validateRequest, JobController_1.default.store);
JobEndpoints.get('/:id', JobController_1.default.show);
exports.default = JobEndpoints;
