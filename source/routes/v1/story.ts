import express, { Router } from "express";
import { uploadMedia } from "../../middleware/file-uploading";
import { AwsS3AccessEndpoints } from "../../config/constants";
import StoryController from "../../controllers/StoryController";
import { paramIDValidationRule } from "../../validation/rules/api-validation";
import { validateRequest } from "../../middleware/api-request-validator";
import LikeController from "../../controllers/LikeController";
const StoryEndpoints: Router = express.Router();
StoryEndpoints.get('/', StoryController.index);
StoryEndpoints.post('/', uploadMedia(AwsS3AccessEndpoints.STORY).fields([{ name: 'images', maxCount: 1, }, { name: 'videos', maxCount: 1, }]), StoryController.store);
StoryEndpoints.delete('/:id', [paramIDValidationRule], validateRequest, StoryController.destroy);
/**
 * 
 * Comments
 * PostId
 */
StoryEndpoints.get('/likes/:id', StoryController.storyLikes);
StoryEndpoints.get('/views/:id', StoryController.storyViews);
StoryEndpoints.post('/likes/:id', [paramIDValidationRule], validateRequest, LikeController.store);
StoryEndpoints.post('/views/:id', [paramIDValidationRule], validateRequest, StoryController.storeViews);
// StoryEndpoints.post('/comments/likes/:id', [paramIDValidationRule], validateRequest, LikeController.store);
// StoryEndpoints.post('/saved-post/:id', savedPostApiValidator, validateRequest, SavedPostController.store);
// StoryEndpoints.post('/comments', createCommentApiValidator, validateRequest, CommentController.store);
// StoryEndpoints.get('/comments/:id', [paramIDValidationRule], validateRequest, CommentController.index);
// StoryEndpoints.post('/comments/likes/:id', [paramIDValidationRule], validateRequest, LikeController.store);
export default StoryEndpoints;