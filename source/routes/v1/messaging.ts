
import express, { Router } from "express";
import MessagingController from "../../controllers/MessagingController";
import { diskUpload, s3Upload } from "../../middleware/file-uploading";
import { AwsS3AccessEndpoints } from "../../config/constants";
import { mediaMessageApiValidator, paramIDValidationRule, postIDValidationRule } from "../../validation/rules/api-validation";
import { validateRequest } from "../../middleware/api-request-validator";
const MessagingEndpoints: Router = express.Router();


// s3Upload(AwsS3AccessEndpoints.MESSAGING).fields([{ name: 'media', maxCount: 10 }])
MessagingEndpoints.post('/media-message', s3Upload(AwsS3AccessEndpoints.MESSAGING).fields([{ name: 'media', maxCount: 10 }]), mediaMessageApiValidator, validateRequest, MessagingController.sendMediaMessage);
MessagingEndpoints.post('/share-post-message', s3Upload(AwsS3AccessEndpoints.MESSAGING).fields([{ name: 'media', maxCount: 10 }]), [...mediaMessageApiValidator, postIDValidationRule], validateRequest, MessagingController.sharingPostMediaMessage);

MessagingEndpoints.delete('/chat/:id', [paramIDValidationRule], validateRequest, MessagingController.deleteChat);
MessagingEndpoints.post('/export-chat/:id', [paramIDValidationRule], validateRequest, MessagingController.exportChat);
export default MessagingEndpoints;