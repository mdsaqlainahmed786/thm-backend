import express, { Router } from "express";
import PostController from "../../controllers/PostController";
import { diskUpload, s3Upload } from "../../middleware/file-uploading";
import { AwsS3AccessEndpoints } from "../../config/constants";
import LikeController from "../../controllers/LikeController";
import { createCommentApiValidator, createLikesApiValidator, paramIDValidationRule, savedPostApiValidator } from "../../validation/rules/api-validation";
import { validateRequest } from "../../middleware/api-request-validator";
import { validate } from "node-cron";
import SavedPostController from "../../controllers/SavedPostController";
import CommentController from "../../controllers/CommentController";
import ReportController from "../../controllers/ReportController";
import Post from "../../database/models/post.model";

const PostEndpoints: Router = express.Router();
/**
 * Saved post endpoints
 */
PostEndpoints.get('/saved-posts', SavedPostController.index);
PostEndpoints.post('/saved-posts/:id', savedPostApiValidator, validateRequest, SavedPostController.store);
/**
 * 
 * Comments
 * PostId
 */
PostEndpoints.post('/comments', createCommentApiValidator, validateRequest, CommentController.store);
PostEndpoints.get('/comments/:id', [paramIDValidationRule], validateRequest, CommentController.index);
PostEndpoints.post('/comments/likes/:id', [paramIDValidationRule], validateRequest, LikeController.store);
PostEndpoints.post('/reports/:id', [paramIDValidationRule], validateRequest, ReportController.reportContent);
PostEndpoints.post('/likes/:id', createLikesApiValidator, validateRequest, LikeController.store);

//Posts
PostEndpoints.post('/', diskUpload.fields([{ name: 'images', maxCount: 10, }, { name: 'videos', maxCount: 10, }]), PostController.store);
PostEndpoints.get('/:id', paramIDValidationRule, validateRequest, PostController.show);
PostEndpoints.delete('/:id', paramIDValidationRule, validateRequest, PostController.destroy);
export default PostEndpoints;