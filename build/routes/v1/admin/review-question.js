"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const api_validation_1 = require("../../../validation/rules/api-validation");
const api_request_validator_1 = require("../../../middleware/api-request-validator");
const api_validation_2 = require("../../../validation/rules/api-validation");
const ReviewQuestionsController_1 = __importDefault(require("../../../controllers/admin/ReviewQuestionsController"));
const ReviewQuestionEndpoints = express_1.default.Router();
ReviewQuestionEndpoints.get('/', ReviewQuestionsController_1.default.index);
ReviewQuestionEndpoints.post('/', api_validation_2.createReviewQuestionApiValidator, api_request_validator_1.validateRequest, ReviewQuestionsController_1.default.store);
ReviewQuestionEndpoints.delete('/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, ReviewQuestionsController_1.default.destroy);
ReviewQuestionEndpoints.put('/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, ReviewQuestionsController_1.default.update);
exports.default = ReviewQuestionEndpoints;
