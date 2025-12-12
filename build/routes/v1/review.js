"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ReviewController_1 = __importDefault(require("../../controllers/ReviewController"));
const api_validation_1 = require("../../validation/rules/api-validation");
const api_request_validator_1 = require("../../middleware/api-request-validator");
const authenticate_1 = __importDefault(require("../../middleware/authenticate"));
const file_uploading_1 = require("../../middleware/file-uploading");
const ReviewEndpoints = express_1.default.Router();
ReviewEndpoints.post('/', authenticate_1.default, file_uploading_1.diskUpload.fields([{ name: 'images', maxCount: 10, }, { name: 'videos', maxCount: 10, }]), ReviewController_1.default.store);
ReviewEndpoints.post('/public', file_uploading_1.diskUpload.fields([{ name: 'images', maxCount: 10, }, { name: 'videos', maxCount: 10, }]), api_validation_1.publicReviewApiValidator, api_request_validator_1.validateRequest, ReviewController_1.default.publicReview);
exports.default = ReviewEndpoints;
