import express, { Router } from "express";
import FrequentlyAskedQuestionsController from "../../controllers/FrequentlyAskedQuestionsController";
const FAQEndpoints: Router = express.Router();
FAQEndpoints.get('', FrequentlyAskedQuestionsController.index);
export default FAQEndpoints;