"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const PostController_1 = __importDefault(require("../../controllers/PostController"));
const file_uploading_1 = require("../../middleware/file-uploading");
const constants_1 = require("../../config/constants");
const LikeController_1 = __importDefault(require("../../controllers/LikeController"));
const api_validation_1 = require("../../validation/rules/api-validation");
const api_request_validator_1 = require("../../middleware/api-request-validator");
const SavedPostController_1 = __importDefault(require("../../controllers/SavedPostController"));
const CommentController_1 = __importDefault(require("../../controllers/CommentController"));
const ReportController_1 = __importDefault(require("../../controllers/ReportController"));
const MediaController_1 = __importDefault(require("../../controllers/MediaController"));
const PostEndpoints = express_1.default.Router();
/**
 * Saved post endpoints
 */
PostEndpoints.get('/saved-posts', SavedPostController_1.default.index);
PostEndpoints.post('/saved-posts/:id', api_validation_1.savedPostApiValidator, api_request_validator_1.validateRequest, SavedPostController_1.default.store);
/**
 *
 * Comments
 * PostId
 */
PostEndpoints.post('/comments', api_validation_1.createCommentApiValidator, api_request_validator_1.validateRequest, CommentController_1.default.store);
PostEndpoints.get('/comments/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, CommentController_1.default.index);
PostEndpoints.delete('/comments/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, CommentController_1.default.destroy);
PostEndpoints.patch('/comments/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, CommentController_1.default.update);
PostEndpoints.post('/comments/reports/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, ReportController_1.default.reportComment);
PostEndpoints.post('/comments/likes/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, LikeController_1.default.store);
PostEndpoints.post('/reports/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, ReportController_1.default.reportContent);
PostEndpoints.post('/likes/:id', api_validation_1.createLikesApiValidator, api_request_validator_1.validateRequest, LikeController_1.default.store);
//Posts
//@ts-ignore
PostEndpoints.post('/', (0, file_uploading_1.s3Upload)(constants_1.AwsS3AccessEndpoints.POST).fields([{ name: 'media', maxCount: 20 }]), PostController_1.default.store);
PostEndpoints.get('/:id', api_validation_1.paramIDValidationRule, api_request_validator_1.validateRequest, PostController_1.default.show);
PostEndpoints.post('/:id/publish-as-story', api_validation_1.paramIDValidationRule, api_request_validator_1.validateRequest, PostController_1.default.publishPostAsStory);
PostEndpoints.delete('/:id', api_validation_1.paramIDValidationRule, api_request_validator_1.validateRequest, PostController_1.default.destroy);
//@ts-ignore
PostEndpoints.delete('/:id/soft', api_validation_1.paramIDValidationRule, api_request_validator_1.validateRequest, PostController_1.default.deletePost);
//@ts-ignore
PostEndpoints.put("/:id", (0, file_uploading_1.s3Upload)(constants_1.AwsS3AccessEndpoints.POST).fields([{ name: 'media', maxCount: 20 }]), api_validation_1.paramIDValidationRule, api_request_validator_1.validateRequest, PostController_1.default.update);
//MediaViews
PostEndpoints.post('/media/views', api_validation_1.createMediaViewsApiValidator, api_request_validator_1.validateRequest, MediaController_1.default.storeViews);
PostEndpoints.post('/views', [], api_request_validator_1.validateRequest, PostController_1.default.storeViews);
exports.default = PostEndpoints;
