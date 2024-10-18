import express, { Router } from "express";
import ContactUsController from "../../controllers/ContactUsController";
import { createContactApiValidator } from "../../validation/rules/api-validation";
import { validateRequest } from "../../middleware/api-request-validator";
const ContactUsEndpoints: Router = express.Router();
ContactUsEndpoints.post('/', createContactApiValidator, validateRequest, ContactUsController.store);
export default ContactUsEndpoints;