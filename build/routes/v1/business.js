"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const api_request_validator_1 = require("../../middleware/api-request-validator");
const authenticate_1 = __importDefault(require("../../middleware/authenticate"));
const api_validation_1 = require("../../validation/rules/api-validation");
const BusinessController_1 = __importDefault(require("../../controllers/BusinessController"));
const BusinessEndpoints = express_1.default.Router();
BusinessEndpoints.get('/get-by-place/:placeID', authenticate_1.default, BusinessController_1.default.getBusinessProfileByPlaceID);
BusinessEndpoints.get('/public/:encryptedID', BusinessController_1.default.getBusinessProfileByID);
BusinessEndpoints.get('/types', BusinessController_1.default.businessTypes);
BusinessEndpoints.get('/subtypes/:id', BusinessController_1.default.businessSubTypes);
BusinessEndpoints.post('/questions', api_validation_1.businessQuestionsApiValidator, api_request_validator_1.validateRequest, BusinessController_1.default.businessQuestions);
BusinessEndpoints.post('/questions/answers', authenticate_1.default, 
//businessQuestionAnswerApiValidator, validateRequest,
BusinessController_1.default.businessQuestionAnswer);
BusinessEndpoints.get('/insights', authenticate_1.default, BusinessController_1.default.insights);
BusinessEndpoints.post('/insights', authenticate_1.default, api_validation_1.collectInsightsDataApiValidator, api_request_validator_1.validateRequest, BusinessController_1.default.collectInsightsData);
exports.default = BusinessEndpoints;
