
import express, { Router } from "express";
import HomeController from "../../controllers/HomeController";
import { businessQuestionAnswerApiValidator, businessQuestionsApiValidator, collectDataApiValidator } from "../../validation/rules/api-validation";
import { validateRequest } from "../../middleware/api-request-validator";
import UserController from "../../controllers/UserController";
import authenticateUser from "../../middleware/authenticate";
import SubscriptionController from "../../controllers/SubscriptionController";
import ReviewController from "../../controllers/ReviewController";
import { publicReviewApiValidator } from "./../../validation/rules/api-validation";
const HomeEndpoints: Router = express.Router();
HomeEndpoints.get('/feed', authenticateUser, HomeController.feed);

HomeEndpoints.get('/get-business/:placeID', authenticateUser, HomeController.getBusinessProfileByPlaceID);
HomeEndpoints.get('/get-business/public/:encryptedID', HomeController.getBusinessProfileByID);

HomeEndpoints.get('/business-types', HomeController.businessTypes);
HomeEndpoints.get('/business-subtypes/:id', HomeController.businessSubTypes);
HomeEndpoints.post('/business-questions', businessQuestionsApiValidator, validateRequest, HomeController.businessQuestions);
HomeEndpoints.post('/business-questions/answers', authenticateUser,
    //businessQuestionAnswerApiValidator, validateRequest,
    UserController.businessQuestionAnswer);
HomeEndpoints.get('/insights', authenticateUser, HomeController.insights);
HomeEndpoints.post('/insights/collect-data', authenticateUser, collectDataApiValidator, validateRequest, HomeController.collectData)
HomeEndpoints.get('/db', HomeController.dbSeeder);
HomeEndpoints.get('/db/s', SubscriptionController.index);
HomeEndpoints.get('/transactions', authenticateUser, HomeController.transactions);
export default HomeEndpoints;