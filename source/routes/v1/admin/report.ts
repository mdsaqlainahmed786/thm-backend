import express, { Router } from "express";
import ReportController from "../../../controllers/ReportController";
import { paramIDValidationRule } from "../../../validation/rules/api-validation";
import { validateRequest } from "../../../middleware/api-request-validator";
const ReportEndpoints: Router = express.Router();
ReportEndpoints.get('/', ReportController.index);
ReportEndpoints.delete('/:id', [paramIDValidationRule], validateRequest, ReportController.destroy);
export default ReportEndpoints;