import express, { Router } from "express";
import HomeController from "../../../controllers/admin/HomeController";
// import { paramIDValidationRule } from "../../../validation/rules/api-validation";
// import { validateRequest } from "../../../middleware/api-request-validator";
const HomeEndpoints: Router = express.Router();
HomeEndpoints.get('/home', HomeController.index);
HomeEndpoints.get('/top-reports', HomeController.topReportedContent);
// HomeEndpoints.get('/business/:id/generate-qr', HomeController.generateReviewQRCode);
export default HomeEndpoints;