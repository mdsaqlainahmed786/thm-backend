"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const api_validation_1 = require("./../../validation/rules/api-validation");
const UserController_1 = __importDefault(require("../../controllers/UserController"));
const SubscriptionController_1 = __importDefault(require("../../controllers/SubscriptionController"));
const file_uploading_1 = require("../../middleware/file-uploading");
const constants_1 = require("../../config/constants");
const api_request_validator_1 = require("../../middleware/api-request-validator");
const ReportController_1 = __importDefault(require("../../controllers/ReportController"));
const messaging_1 = __importDefault(require("./messaging"));
const UserEndpoints = express_1.default.Router();
UserEndpoints.get('/profile', UserController_1.default.profile);
UserEndpoints.get('/profile/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, UserController_1.default.publicProfile);
UserEndpoints.patch('/edit-profile', UserController_1.default.editProfile);
UserEndpoints.post('/edit-profile-pic', (0, file_uploading_1.s3Upload)(constants_1.AwsS3AccessEndpoints.USERS).fields([{ name: 'profilePic', maxCount: 1 }]), UserController_1.default.changeProfilePic);
UserEndpoints.post('/business-profile/property-picture', 
// NOTE: use `.any()` to prevent Multer from hard-failing when the client accidentally sends
// more than the allowed max images. We enforce max count in the controller and delete extras.
// Store these under the business-property prefix (cleaner separation than USERS).
(0, file_uploading_1.s3Upload)(constants_1.AwsS3AccessEndpoints.BUSINESS_PROPERTY).any(), UserController_1.default.businessPropertyPictures);
UserEndpoints.post('/address', api_validation_1.createAddressApiValidator, api_request_validator_1.validateRequest, UserController_1.default.address);
UserEndpoints.get('/business-profile/documents', UserController_1.default.businessDocument);
UserEndpoints.post('/business-profile/documents', (0, file_uploading_1.s3Upload)(constants_1.AwsS3AccessEndpoints.USERS).fields([{ name: 'businessRegistration', maxCount: 1 }, { name: 'addressProof', maxCount: 1 }]), UserController_1.default.businessDocumentUpload);
UserEndpoints.get('/subscription/meta', SubscriptionController_1.default.subscriptionMeta);
UserEndpoints.get('/subscription', SubscriptionController_1.default.subscription);
UserEndpoints.post('/subscription', api_validation_1.buySubscriptionApiValidator, api_request_validator_1.validateRequest, SubscriptionController_1.default.buySubscription);
UserEndpoints.get('/subscription/plans', SubscriptionController_1.default.getSubscriptionPlans);
UserEndpoints.post('/subscription/checkout', api_validation_1.subscriptionCheckoutApiValidator, api_request_validator_1.validateRequest, SubscriptionController_1.default.subscriptionCheckout);
UserEndpoints.delete('/subscription', SubscriptionController_1.default.cancelSubscription);
UserEndpoints.get('/posts/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, UserController_1.default.userPosts);
UserEndpoints.get('/videos/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, UserController_1.default.userPostMedia);
UserEndpoints.get('/images/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, UserController_1.default.userPostMedia);
UserEndpoints.get('/reviews/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, UserController_1.default.userReviews);
UserEndpoints.get('/tag-people', UserController_1.default.tagPeople);
UserEndpoints.delete('/account', UserController_1.default.deleteAccount);
UserEndpoints.patch('/account/disable', UserController_1.default.deactivateAccount);
UserEndpoints.get('/blocks', UserController_1.default.blockedUsers);
UserEndpoints.post('/blocks/:id', UserController_1.default.blockUser);
UserEndpoints.post('/report/:id', ReportController_1.default.reportUser);
UserEndpoints.use('/messaging', messaging_1.default);
exports.default = UserEndpoints;
