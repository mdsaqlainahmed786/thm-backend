
import express, { Router } from "express";
import JobController from "../../controllers/JobController";
import { createJobApiValidator } from "../../validation/rules/api-validation";
import { validateRequest } from "../../middleware/api-request-validator";
const JobEndpoints: Router = express.Router();
JobEndpoints.post('/', createJobApiValidator, validateRequest, JobController.store);
JobEndpoints.get('/:id', JobController.show);
export default JobEndpoints;