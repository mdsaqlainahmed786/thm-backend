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
const api_request_validator_1 = require("../../middleware/api-request-validator");
const authenticate_1 = __importStar(require("../../middleware/authenticate"));
const api_validation_1 = require("../../validation/rules/api-validation");
const BusinessController_1 = __importDefault(require("../../controllers/BusinessController"));
const file_uploading_1 = require("../../middleware/file-uploading");
const constants_1 = require("../../config/constants");
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
// Restaurant menu routes
// POST: Upload restaurant menu items (images or PDFs) - only for restaurant business accounts
BusinessEndpoints.post('/restaurant/menu', authenticate_1.default, authenticate_1.isBusinessUser, (0, file_uploading_1.s3Upload)(constants_1.AwsS3AccessEndpoints.BUSINESS_DOCUMENTS).fields([{ name: 'menu', maxCount: 10 }]), BusinessController_1.default.addRestaurantMenu);
// GET: Fetch menu items for a business profile (public)
BusinessEndpoints.get('/restaurant/:businessProfileID/menu', BusinessController_1.default.getRestaurantMenu);
// DELETE: Delete a specific menu item - only for restaurant business owners
BusinessEndpoints.delete('/restaurant/menu/:id', authenticate_1.default, authenticate_1.isBusinessUser, [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, BusinessController_1.default.deleteRestaurantMenu);
BusinessEndpoints.get('/:id', BusinessController_1.default.getBusinessProfileByDirectID);
exports.default = BusinessEndpoints;
