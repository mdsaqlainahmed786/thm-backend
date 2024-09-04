
import express, { Router } from "express";
import HomeController from "../../controllers/HomeController";
import { businessQuestionsApiValidator } from "../../validation/rules/api-validation";
import { validateRequest } from "../../middleware/api-request-validator";
const HomeEndpoints: Router = express.Router();
HomeEndpoints.get('/home', HomeController.home);
HomeEndpoints.get('/business-types', HomeController.businessTypes);
HomeEndpoints.get('/business-subtypes/:id', HomeController.businessSubTypes);
HomeEndpoints.post('/business-questions', businessQuestionsApiValidator, validateRequest, HomeController.businessQuestions);
export default HomeEndpoints;