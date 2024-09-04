import express, { Router, Request, Response } from "express";
import UserController from "../../controllers/UserController";
import authenticateUser from "../../middleware/authenticate";
import { uploadMedia } from "../../middleware/file-uploading";
import { AwsS3AccessEndpoints } from "../../config/constants";
const UserEndpoints: Router = express.Router();
UserEndpoints.get('/profile', authenticateUser, UserController.profile);
UserEndpoints.patch('/edit-profile', authenticateUser, UserController.editProfile);
UserEndpoints.post('/edit-profile-pic', authenticateUser, uploadMedia(AwsS3AccessEndpoints.USERS).fields([{ name: 'profilePic', maxCount: 1 }]), UserController.changeProfilePic)
export default UserEndpoints;