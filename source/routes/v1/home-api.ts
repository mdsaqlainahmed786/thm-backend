
import express, { Router } from "express";
import HomeController from "../../controllers/HomeController";
import { businessQuestionAnswerApiValidator, businessQuestionsApiValidator } from "../../validation/rules/api-validation";
import { validateRequest } from "../../middleware/api-request-validator";
import UserController from "../../controllers/UserController";
import authenticateUser from "../../middleware/authenticate";
import SubscriptionController from "../../controllers/SubscriptionController";
const HomeEndpoints: Router = express.Router();
HomeEndpoints.get('/feed', authenticateUser, HomeController.feed);
HomeEndpoints.get('/business-types', HomeController.businessTypes);
HomeEndpoints.get('/business-subtypes/:id', HomeController.businessSubTypes);
HomeEndpoints.post('/business-questions', businessQuestionsApiValidator, validateRequest, HomeController.businessQuestions);
HomeEndpoints.post('/business-questions/answers', authenticateUser,
    //businessQuestionAnswerApiValidator, validateRequest,
    UserController.businessQuestionAnswer);
HomeEndpoints.get('/db', HomeController.dbSeeder);
HomeEndpoints.get('/db/s', SubscriptionController.index);
export default HomeEndpoints;