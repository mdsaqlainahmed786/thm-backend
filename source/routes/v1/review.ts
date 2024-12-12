import express, { Router } from "express";
import ReviewController from "../../controllers/ReviewController";
import { publicReviewApiValidator } from "../../validation/rules/api-validation";
import { validateRequest } from "../../middleware/api-request-validator";
import authenticateUser from "../../middleware/authenticate";
const ReviewEndpoints: Router = express.Router();
ReviewEndpoints.post('/', authenticateUser, ReviewController.store);
ReviewEndpoints.post('/public', publicReviewApiValidator, validateRequest, ReviewController.publicReview);
export default ReviewEndpoints;