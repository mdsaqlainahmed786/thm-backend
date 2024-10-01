
import express, { Router } from "express";
import UserConnectionController from "../../controllers/UserConnectionController";
import { validateRequest } from "../../middleware/api-request-validator";
import authenticateUser from "../../middleware/authenticate";
import { paramIDValidationRule } from "../../validation/rules/api-validation";
const UserConnectionEndpoints: Router = express.Router();
UserConnectionEndpoints.post('/follow/:id', [paramIDValidationRule], validateRequest, UserConnectionController.sendFollowRequest);
// UserConnectionEndpoints.post('/follow-back/:id', authenticateUser, [paramIDValidationRule], validateRequest, UserConnectionController.acceptFollow);
UserConnectionEndpoints.post('/accept-follow/:id', [paramIDValidationRule], validateRequest, UserConnectionController.acceptFollow);
UserConnectionEndpoints.delete('/unfollow/:id', [paramIDValidationRule], validateRequest, UserConnectionController.unFollow);
UserConnectionEndpoints.get('/follower/:id', [paramIDValidationRule], validateRequest, UserConnectionController.follower);
UserConnectionEndpoints.get('/following/:id', [paramIDValidationRule], validateRequest, UserConnectionController.following);
export default UserConnectionEndpoints;