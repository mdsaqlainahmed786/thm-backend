"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const file_uploading_1 = require("../../middleware/file-uploading");
const constants_1 = require("../../config/constants");
const StoryController_1 = __importDefault(require("../../controllers/StoryController"));
const api_validation_1 = require("../../validation/rules/api-validation");
const api_request_validator_1 = require("../../middleware/api-request-validator");
const LikeController_1 = __importDefault(require("../../controllers/LikeController"));
const CommentController_1 = __importDefault(require("../../controllers/CommentController"));
const StoryEndpoints = express_1.default.Router();
StoryEndpoints.get('/', StoryController_1.default.index);
StoryEndpoints.post('/', (0, file_uploading_1.s3Upload)(constants_1.AwsS3AccessEndpoints.POST).fields([{ name: 'images', maxCount: 1, }, { name: 'videos', maxCount: 1, }]), StoryController_1.default.store);
StoryEndpoints.delete('/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, StoryController_1.default.destroy);
/**
 *
 * Comments
 * PostId
 */
StoryEndpoints.get('/likes/:id', StoryController_1.default.storyLikes);
StoryEndpoints.get('/views/:id', StoryController_1.default.storyViews);
StoryEndpoints.post('/likes/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, LikeController_1.default.store);
StoryEndpoints.post('/views/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, StoryController_1.default.storeViews);
// StoryEndpoints.post('/comments/likes/:id', [paramIDValidationRule], validateRequest, LikeController.store);
// StoryEndpoints.post('/saved-post/:id', savedPostApiValidator, validateRequest, SavedPostController.store);
// StoryEndpoints.post('/comments', createCommentApiValidator, validateRequest, CommentController.store);
// StoryEndpoints.get('/comments/:id', [paramIDValidationRule], validateRequest, CommentController.index);
// StoryEndpoints.post('/comments/likes/:id', [paramIDValidationRule], validateRequest, LikeController.store);
StoryEndpoints.post('/comments', CommentController_1.default.store);
StoryEndpoints.get('/comments/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, CommentController_1.default.index);
StoryEndpoints.patch('/comments/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, CommentController_1.default.update);
StoryEndpoints.delete('/comments/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, CommentController_1.default.destroy);
exports.default = StoryEndpoints;
