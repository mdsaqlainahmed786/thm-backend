import express, { Router } from "express";
import PostController from "../../controllers/PostController";
import { uploadMedia } from "../../middleware/file-uploading";
import { AwsS3AccessEndpoints } from "../../config/constants";
import LikeController from "../../controllers/LikeController";
import { createCommentApiValidator, createLikesApiValidator, paramIDValidationRule, savedPostApiValidator } from "../../validation/rules/api-validation";
import { validateRequest } from "../../middleware/api-request-validator";
import { validate } from "node-cron";
import SavedPostController from "../../controllers/SavedPostController";
import CommentController from "../../controllers/CommentController";

const PostEndpoints: Router = express.Router();
// PostEndpoints.get('/', RankHistoryController.index);
PostEndpoints.post('/', uploadMedia(AwsS3AccessEndpoints.POST).fields([{ name: 'images', maxCount: 10, }, { name: 'videos', maxCount: 10, }]), PostController.store);
// PostEndpoints.put('/:id', RankHistoryController.update);
// PostEndpoints.delete('/:id', RankHistoryController.destroy);
PostEndpoints.post('/likes/:id', createLikesApiValidator, validateRequest, LikeController.store);

/**
 * Saved post endpoints
 */
PostEndpoints.get('/saved-posts', SavedPostController.index);
PostEndpoints.post('/saved-post/:id', savedPostApiValidator, validateRequest, SavedPostController.store);

PostEndpoints.get('/shared-posts', PostController.sharedPost);
/**
 * 
 * Comments
 * PostId
 */
PostEndpoints.post('/comments', createCommentApiValidator, validateRequest, CommentController.store);
PostEndpoints.get('/comments/:id', [paramIDValidationRule], validateRequest, CommentController.index);
PostEndpoints.post('/comments/likes/:id', [paramIDValidationRule], validateRequest, LikeController.store);
export default PostEndpoints;