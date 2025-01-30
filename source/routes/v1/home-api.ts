
import express, { Router } from "express";
import HomeController from "../../controllers/HomeController";
import { businessQuestionAnswerApiValidator, businessQuestionsApiValidator, collectInsightsDataApiValidator } from "../../validation/rules/api-validation";
import { validateRequest } from "../../middleware/api-request-validator";
import UserController from "../../controllers/UserController";
import authenticateUser from "../../middleware/authenticate";
import SubscriptionController from "../../controllers/SubscriptionController";
import BusinessController from "../../controllers/BusinessController";
const HomeEndpoints: Router = express.Router();
HomeEndpoints.get('/feed', authenticateUser, HomeController.feed);

HomeEndpoints.get('/get-business/:placeID', authenticateUser, HomeController.getBusinessProfileByPlaceID);
HomeEndpoints.get('/get-business/public/:encryptedID', HomeController.getBusinessProfileByID);


//FIXME Remove this api after deploy
HomeEndpoints.get('/business-types', BusinessController.businessTypes);
HomeEndpoints.get('/business-subtypes/:id', BusinessController.businessSubTypes);
HomeEndpoints.post('/business-questions', businessQuestionsApiValidator, validateRequest, BusinessController.businessQuestions);
HomeEndpoints.post('/business-questions/answers', authenticateUser,
    //businessQuestionAnswerApiValidator, validateRequest,
    BusinessController.businessQuestionAnswer);
HomeEndpoints.get('/insights', authenticateUser, BusinessController.insights);
HomeEndpoints.post('/insights/collect-data', authenticateUser, collectInsightsDataApiValidator, validateRequest, BusinessController.collectInsightsData)


HomeEndpoints.get('/db', HomeController.dbSeeder);
HomeEndpoints.get('/db/s', SubscriptionController.index);
HomeEndpoints.get('/transactions', authenticateUser, HomeController.transactions);
HomeEndpoints.get('/profile-picture/thumbnail', HomeController.createThumbnail);
HomeEndpoints.get('/professions', HomeController.professions);
HomeEndpoints.get('/suggestions', authenticateUser, HomeController.suggestion);
export default HomeEndpoints;