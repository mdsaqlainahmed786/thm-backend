import express, { Router, Request, Response } from "express";
import UserController from "../../controllers/UserController";
import SubscriptionController from "../../controllers/SubscriptionController";
import authenticateUser from "../../middleware/authenticate";
import { uploadMedia } from "../../middleware/file-uploading";
import { AwsS3AccessEndpoints } from "../../config/constants";
const UserEndpoints: Router = express.Router();
UserEndpoints.get('/profile', authenticateUser, UserController.profile);
UserEndpoints.patch('/edit-profile', authenticateUser, UserController.editProfile);
UserEndpoints.post('/edit-profile-pic', authenticateUser, uploadMedia(AwsS3AccessEndpoints.USERS).fields([{ name: 'profilePic', maxCount: 1 }]), UserController.changeProfilePic);
UserEndpoints.post('/business-profile/documents', authenticateUser, uploadMedia(AwsS3AccessEndpoints.USERS).fields([{ name: 'businessRegistration', maxCount: 1 }, { name: 'addressProof', maxCount: 1 }]), UserController.businessDocumentUpload);
UserEndpoints.post('/business-profile/subscription', authenticateUser, SubscriptionController.buySubscription);
UserEndpoints.get('/business-profile/subscription', authenticateUser, SubscriptionController.subscription)
export default UserEndpoints;