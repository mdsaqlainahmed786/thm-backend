import express, { Router } from "express";
import { paramIDValidationRule } from "../../validation/rules/api-validation";
import { validateRequest } from "../../middleware/api-request-validator";
import FileQueueController from "../../controllers/FileQueueController";
const FileQueueEndpoints: Router = express.Router();
FileQueueEndpoints.get('/', FileQueueController.index);
FileQueueEndpoints.put('/:id', [paramIDValidationRule], validateRequest, FileQueueController.update);
export default FileQueueEndpoints;