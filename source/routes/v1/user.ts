import express, { Router } from "express";
import { buySubscriptionApiValidator, subscriptionCheckoutApiValidator, subscriptionPlansApiValidator } from './../../validation/rules/api-validation';
import UserController from "../../controllers/UserController";
import SubscriptionController from "../../controllers/SubscriptionController";
import authenticateUser from "../../middleware/authenticate";
import { uploadMedia } from "../../middleware/file-uploading";
import { AwsS3AccessEndpoints } from "../../config/constants";
import { validateRequest } from '../../middleware/api-request-validator';
const UserEndpoints: Router = express.Router();
UserEndpoints.get('/profile', authenticateUser, UserController.profile);
UserEndpoints.patch('/edit-profile', authenticateUser, UserController.editProfile);
UserEndpoints.post('/edit-profile-pic', authenticateUser, uploadMedia(AwsS3AccessEndpoints.USERS).fields([{ name: 'profilePic', maxCount: 1 }]), UserController.changeProfilePic);
UserEndpoints.post('/business-profile/documents', authenticateUser, uploadMedia(AwsS3AccessEndpoints.USERS).fields([{ name: 'businessRegistration', maxCount: 1 }, { name: 'addressProof', maxCount: 1 }]), UserController.businessDocumentUpload);
UserEndpoints.post('/business-profile/subscription', authenticateUser, buySubscriptionApiValidator, validateRequest, SubscriptionController.buySubscription);
UserEndpoints.post('/business-profile/subscription/plans', authenticateUser, subscriptionPlansApiValidator, validateRequest, SubscriptionController.getSubscriptionPlans);
UserEndpoints.post('/business-profile/subscription/checkout', authenticateUser, subscriptionCheckoutApiValidator, validateRequest, SubscriptionController.subscriptionCheckout);
UserEndpoints.get('/business-profile/subscription', authenticateUser, subscriptionPlansApiValidator, validateRequest, SubscriptionController.index);//FIXME Remove this api
export default UserEndpoints;