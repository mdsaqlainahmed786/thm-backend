import express, { Router } from "express";
import { validateRequest } from "../../middleware/api-request-validator";
import authenticateUser from "../../middleware/authenticate";
import { businessQuestionsApiValidator, collectInsightsDataApiValidator } from "../../validation/rules/api-validation";
import BusinessController from "../../controllers/BusinessController";
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
BusinessEndpoints.get('/:id', BusinessController.getBusinessProfileByDirectID);
export default BusinessEndpoints;