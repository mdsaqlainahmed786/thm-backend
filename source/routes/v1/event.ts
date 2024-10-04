import express, { Router } from "express";
import EventController from "../../controllers/EventController";
import { createEventApiValidator } from "../../validation/rules/api-validation";
import { validateRequest } from "../../middleware/api-request-validator";
import { uploadMedia } from "../../middleware/file-uploading";
import { AwsS3AccessEndpoints } from "../../config/constants";
const EventEndpoints: Router = express.Router();
EventEndpoints.post('/', uploadMedia(AwsS3AccessEndpoints.POST).fields([{ name: 'images', maxCount: 1, }]), createEventApiValidator, validateRequest, EventController.store);
export default EventEndpoints;