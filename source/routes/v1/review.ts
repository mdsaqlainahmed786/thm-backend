import express, { Router } from "express";
import ReviewController from "../../controllers/ReviewController";

const ReviewEndpoints: Router = express.Router();
ReviewEndpoints.post('/', ReviewController.store);
export default ReviewEndpoints;