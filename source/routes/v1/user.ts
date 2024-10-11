import express, { Router } from "express";
import { buySubscriptionApiValidator, paramIDValidationRule, subscriptionCheckoutApiValidator, } from './../../validation/rules/api-validation';
import UserController from "../../controllers/UserController";
import SubscriptionController from "../../controllers/SubscriptionController";
import authenticateUser from "../../middleware/authenticate";
import { uploadMedia } from "../../middleware/file-uploading";
import { AwsS3AccessEndpoints } from "../../config/constants";
import { validateRequest } from '../../middleware/api-request-validator';
const UserEndpoints: Router = express.Router();
UserEndpoints.get('/profile', UserController.profile);
UserEndpoints.get('/profile/:id', [paramIDValidationRule], validateRequest, UserController.publicProfile);
UserEndpoints.patch('/edit-profile', UserController.editProfile);
UserEndpoints.post('/edit-profile-pic', uploadMedia(AwsS3AccessEndpoints.USERS).fields([{ name: 'profilePic', maxCount: 1 }]), UserController.changeProfilePic);
UserEndpoints.post('/business-profile/property-picture',
    uploadMedia(AwsS3AccessEndpoints.BUSINESS_PROPERTY).fields([{ name: 'images', maxCount: 6 }]),
    authenticateUser, UserController.businessPropertyPictures);
UserEndpoints.post('/business-profile/documents', uploadMedia(AwsS3AccessEndpoints.USERS).fields([{ name: 'businessRegistration', maxCount: 1 }, { name: 'addressProof', maxCount: 1 }]), UserController.businessDocumentUpload);
UserEndpoints.post('/business-profile/subscription', buySubscriptionApiValidator, validateRequest, SubscriptionController.buySubscription);
UserEndpoints.get('/business-profile/subscription/plans', SubscriptionController.getSubscriptionPlans);
UserEndpoints.post('/business-profile/subscription/checkout', subscriptionCheckoutApiValidator, validateRequest, SubscriptionController.subscriptionCheckout);
UserEndpoints.get('/business-profile/subscription', SubscriptionController.index);//FIXME Remove this api

UserEndpoints.get('/posts/:id', [paramIDValidationRule], validateRequest, UserController.userPosts);
UserEndpoints.get('/videos/:id', [paramIDValidationRule], validateRequest, UserController.userPostMedia);
UserEndpoints.get('/images/:id', [paramIDValidationRule], validateRequest, UserController.userPostMedia);
UserEndpoints.get('/reviews/:id', [paramIDValidationRule], validateRequest, UserController.userReviews);
export default UserEndpoints;