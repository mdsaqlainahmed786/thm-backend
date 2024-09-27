import express, { Router } from "express";
import PostController from "../../controllers/PostController";
import { uploadMedia } from "../../middleware/file-uploading";
import { AwsS3AccessEndpoints } from "../../config/constants";
import LikeController from "../../controllers/LikeController";
import { createLikesApiValidator, savedPostApiValidator } from "../../validation/rules/api-validation";
import { validateRequest } from "../../middleware/api-request-validator";
import { validate } from "node-cron";
import SavedPostController from "../../controllers/SavedPostController";
const PostEndpoints: Router = express.Router();
// PostEndpoints.get('/', RankHistoryController.index);
PostEndpoints.post('/', uploadMedia(AwsS3AccessEndpoints.POST).fields([{ name: 'images', maxCount: 10, }, { name: 'videos', maxCount: 10, }]), PostController.store);
// PostEndpoints.put('/:id', RankHistoryController.update);
// PostEndpoints.delete('/:id', RankHistoryController.destroy);
PostEndpoints.post('/likes/:id', createLikesApiValidator, validateRequest, LikeController.store);
PostEndpoints.post('/saved-post/:id', savedPostApiValidator, validateRequest, SavedPostController.store)
export default PostEndpoints;