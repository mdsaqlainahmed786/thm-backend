import express, { Router } from "express";
import { paramIDValidationRule } from "../../../validation/rules/api-validation";
import { validateRequest } from "../../../middleware/api-request-validator";
import PostController from "../../../controllers/admin/PostController";
const PostEndpoints: Router = express.Router();
PostEndpoints.get('/', PostController.index);
PostEndpoints.put('/:id', PostController.update);
PostEndpoints.delete('/:id', [paramIDValidationRule], validateRequest, PostController.destroy);
export default PostEndpoints;