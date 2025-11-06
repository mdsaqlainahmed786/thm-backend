import express, { Router } from "express";
import { diskUpload, s3Upload } from "../../middleware/file-uploading";
import { AwsS3AccessEndpoints } from "../../config/constants";
import StoryController from "../../controllers/StoryController";
import { paramIDValidationRule } from "../../validation/rules/api-validation";
import { validateRequest } from "../../middleware/api-request-validator";
import LikeController from "../../controllers/LikeController";
import CommentController from "../../controllers/CommentController";
const StoryEndpoints: Router = express.Router();
StoryEndpoints.get('/', StoryController.index);
StoryEndpoints.post('/',s3Upload(AwsS3AccessEndpoints.POST).fields([{ name: 'images', maxCount: 1, }, { name: 'videos', maxCount: 1, }]), StoryController.store);
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

StoryEndpoints.post('/comments', CommentController.store);
StoryEndpoints.get('/comments/:id', [paramIDValidationRule], validateRequest, CommentController.index);
StoryEndpoints.patch('/comments/:id', [paramIDValidationRule], validateRequest, CommentController.update);
StoryEndpoints.delete('/comments/:id', [paramIDValidationRule], validateRequest, CommentController.destroy);

export default StoryEndpoints;