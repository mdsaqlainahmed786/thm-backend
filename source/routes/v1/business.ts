import express, { Router } from "express";
import { validateRequest } from "../../middleware/api-request-validator";
import authenticateUser, { isBusinessUser } from "../../middleware/authenticate";
import { businessQuestionsApiValidator, collectInsightsDataApiValidator } from "../../validation/rules/api-validation";
import BusinessController from "../../controllers/BusinessController";
import { s3Upload } from "../../middleware/file-uploading";
import { AwsS3AccessEndpoints } from "../../config/constants";
const BusinessEndpoints: Router = express.Router();

BusinessEndpoints.get('/get-by-place/:placeID', authenticateUser, BusinessController.getBusinessProfileByPlaceID);

BusinessEndpoints.get('/public/:encryptedID', BusinessController.getBusinessProfileByID);
BusinessEndpoints.get('/types', BusinessController.businessTypes);
BusinessEndpoints.get('/subtypes/:id', BusinessController.businessSubTypes);
BusinessEndpoints.post('/questions', businessQuestionsApiValidator, validateRequest, BusinessController.businessQuestions);
BusinessEndpoints.post('/questions/answers', authenticateUser,
    //businessQuestionAnswerApiValidator, validateRequest,
    BusinessController.businessQuestionAnswer);
BusinessEndpoints.get('/insights', authenticateUser, BusinessController.insights);
BusinessEndpoints.post('/insights', authenticateUser, collectInsightsDataApiValidator, validateRequest, BusinessController.collectInsightsData);

// Restaurant menu routes
// POST: Upload restaurant menu items (images or PDFs) - only for restaurant business accounts
BusinessEndpoints.post(
    '/restaurant/menu',
    authenticateUser,
    isBusinessUser,
    s3Upload(AwsS3AccessEndpoints.BUSINESS_DOCUMENTS).fields([{ name: 'menu', maxCount: 10 }]),
    BusinessController.addRestaurantMenu
);

// GET: Fetch menu items for a business profile (public)
BusinessEndpoints.get(
    '/restaurant/:businessProfileID/menu',
    BusinessController.getRestaurantMenu
);

BusinessEndpoints.get('/:id', BusinessController.getBusinessProfileByDirectID);
export default BusinessEndpoints;