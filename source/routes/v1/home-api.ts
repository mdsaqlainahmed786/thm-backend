
import express, { Router } from "express";
import HomeController from "../../controllers/HomeController";
import { businessQuestionAnswerApiValidator, businessQuestionsApiValidator } from "../../validation/rules/api-validation";
import { validateRequest } from "../../middleware/api-request-validator";
import UserController from "../../controllers/UserController";
import authenticateUser from "../../middleware/authenticate";
const HomeEndpoints: Router = express.Router();
HomeEndpoints.get('/home', HomeController.home);
HomeEndpoints.get('/business-types', HomeController.businessTypes);
HomeEndpoints.get('/business-subtypes/:id', HomeController.businessSubTypes);
HomeEndpoints.post('/business-questions', businessQuestionsApiValidator, validateRequest, HomeController.businessQuestions);
HomeEndpoints.post('/business-questions/answers', authenticateUser,
    //businessQuestionAnswerApiValidator, validateRequest,
    UserController.businessQuestionAnswer);
export default HomeEndpoints;