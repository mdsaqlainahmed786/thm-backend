import express, { Router } from "express";
import { buySubscriptionApiValidator, createAddressApiValidator, paramIDValidationRule, subscriptionCheckoutApiValidator, } from './../../validation/rules/api-validation';
import UserController from "../../controllers/UserController";
import SubscriptionController from "../../controllers/SubscriptionController";
import authenticateUser from "../../middleware/authenticate";
import { diskUpload, s3Upload } from "../../middleware/file-uploading";
import { AwsS3AccessEndpoints } from "../../config/constants";
import { validateRequest } from '../../middleware/api-request-validator';
import ReportController from "../../controllers/ReportController";
import MessagingController from '../../controllers/MessagingController';
import { mediaMessageApiValidator } from "./../../validation/rules/api-validation";
import MessagingEndpoints from "./messaging";
const UserEndpoints: Router = express.Router();
UserEndpoints.get('/profile', UserController.profile);
UserEndpoints.get('/profile/:id', [paramIDValidationRule], validateRequest, UserController.publicProfile);
UserEndpoints.patch('/edit-profile', UserController.editProfile);
UserEndpoints.post('/edit-profile-pic', s3Upload(AwsS3AccessEndpoints.USERS).fields([{ name: 'profilePic', maxCount: 1 }]), UserController.changeProfilePic);
UserEndpoints.post('/business-profile/property-picture',
    authenticateUser,
    s3Upload(AwsS3AccessEndpoints.USERS).fields([{ name: 'images', maxCount: 6 }]),
    UserController.businessPropertyPictures);
UserEndpoints.post('/address', createAddressApiValidator, validateRequest, UserController.address);

UserEndpoints.get('/business-profile/documents', UserController.businessDocument);
UserEndpoints.post('/business-profile/documents', s3Upload(AwsS3AccessEndpoints.USERS).fields([{ name: 'businessRegistration', maxCount: 1 }, { name: 'addressProof', maxCount: 1 }]), UserController.businessDocumentUpload);


UserEndpoints.get('/subscription/meta', SubscriptionController.subscriptionMeta);
UserEndpoints.get('/subscription', SubscriptionController.subscription);
UserEndpoints.post('/subscription', buySubscriptionApiValidator, validateRequest, SubscriptionController.buySubscription);
UserEndpoints.get('/subscription/plans', SubscriptionController.getSubscriptionPlans);
UserEndpoints.post('/subscription/checkout', subscriptionCheckoutApiValidator, validateRequest, SubscriptionController.subscriptionCheckout);
UserEndpoints.delete('/subscription', SubscriptionController.cancelSubscription);

UserEndpoints.get('/posts/:id', [paramIDValidationRule], validateRequest, UserController.userPosts);
UserEndpoints.get('/videos/:id', [paramIDValidationRule], validateRequest, UserController.userPostMedia);
UserEndpoints.get('/images/:id', [paramIDValidationRule], validateRequest, UserController.userPostMedia);
UserEndpoints.get('/reviews/:id', [paramIDValidationRule], validateRequest, UserController.userReviews);
UserEndpoints.get('/tag-people', UserController.tagPeople);
UserEndpoints.delete('/account', UserController.deleteAccount);
UserEndpoints.patch('/account/disable', UserController.deactivateAccount);
UserEndpoints.get('/blocks', UserController.blockedUsers);
UserEndpoints.post('/blocks/:id', UserController.blockUser);
UserEndpoints.post('/report/:id', ReportController.reportUser);
UserEndpoints.use('/messaging', MessagingEndpoints);
export default UserEndpoints;