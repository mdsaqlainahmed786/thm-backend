import express, { Router } from "express";
import PostController from "../../controllers/PostController";
import { diskUpload, s3Upload } from "../../middleware/file-uploading";
import { AwsS3AccessEndpoints } from "../../config/constants";
import LikeController from "../../controllers/LikeController";
import { createCommentApiValidator, createLikesApiValidator, createMediaViewsApiValidator, paramIDValidationRule, savedPostApiValidator } from "../../validation/rules/api-validation";
import { validateRequest } from "../../middleware/api-request-validator";
import SavedPostController from "../../controllers/SavedPostController";
import CommentController from "../../controllers/CommentController";
import ReportController from "../../controllers/ReportController";
import MediaController from "../../controllers/MediaController";
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
PostEndpoints.delete('/comments/:id', [paramIDValidationRule], validateRequest, CommentController.destroy);
PostEndpoints.patch('/comments/:id', [paramIDValidationRule], validateRequest, CommentController.update);
PostEndpoints.post('/comments/reports/:id', [paramIDValidationRule], validateRequest, ReportController.reportComment);
PostEndpoints.post('/comments/likes/:id', [paramIDValidationRule], validateRequest, LikeController.store);
PostEndpoints.post('/reports/:id', [paramIDValidationRule], validateRequest, ReportController.reportContent);
PostEndpoints.post('/likes/:id', createLikesApiValidator, validateRequest, LikeController.store);

//Posts
PostEndpoints.get('/feed', PostController.index);
PostEndpoints.post('/', diskUpload.fields([{ name: 'media', maxCount: 20 }]), PostController.store);
PostEndpoints.get('/:id', paramIDValidationRule, validateRequest, PostController.show);
PostEndpoints.delete('/:id', paramIDValidationRule, validateRequest, PostController.destroy);
PostEndpoints.delete('/:id/soft', paramIDValidationRule, validateRequest, PostController.deletePost);
PostEndpoints.put("/:id", diskUpload.fields([{ name: 'media', maxCount: 20 }]), paramIDValidationRule, validateRequest, PostController.update);

//MediaViews
PostEndpoints.post('/media/views', createMediaViewsApiValidator, validateRequest, MediaController.storeViews);
PostEndpoints.post('/views', [], validateRequest, PostController.storeViews);
export default PostEndpoints;