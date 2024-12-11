import express, { Router } from "express";
import ReviewController from "../../../controllers/admin/ReviewController";
import Review from "../../../database/models/reviews.model";
const ReviewEndpoints: Router = express.Router();
ReviewEndpoints.get('/', ReviewController.index);
ReviewEndpoints.delete('/:id', ReviewController.destroy);
export default ReviewEndpoints;