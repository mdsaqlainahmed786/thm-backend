
import express, { Router } from "express";
import MessagingController from "../../controllers/MessagingController";
import { diskUpload, s3Upload } from "../../middleware/file-uploading";
import { AwsS3AccessEndpoints } from "../../config/constants";
import { mediaMessageApiValidator, paramIDValidationRule } from "../../validation/rules/api-validation";
import { validateRequest } from "../../middleware/api-request-validator";
const MessagingEndpoints: Router = express.Router();


// s3Upload(AwsS3AccessEndpoints.MESSAGING).fields([{ name: 'media', maxCount: 10 }])
MessagingEndpoints.post('/media-message', diskUpload.fields([{ name: 'media', maxCount: 10 }]), mediaMessageApiValidator, validateRequest, MessagingController.sendMediaMessage);
MessagingEndpoints.delete('/chat/:id', [paramIDValidationRule], validateRequest, MessagingController.deleteChat);
MessagingEndpoints.post('/export-chat/:id', [paramIDValidationRule], validateRequest, MessagingController.exportChat);
export default MessagingEndpoints;