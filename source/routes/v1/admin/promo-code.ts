import express, { Router } from "express";
import { paramIDValidationRule } from "../../../validation/rules/api-validation";
import { validateRequest } from "../../../middleware/api-request-validator";
import PostController from "../../../controllers/admin/PostController";
import PromoCodeController from "../../../controllers/admin/PromoCodeController";
const PromoCodeEndpoints: Router = express.Router();
PromoCodeEndpoints.get('/', PromoCodeController.index);
PromoCodeEndpoints.delete('/:id', [paramIDValidationRule], validateRequest, PromoCodeController.destroy);
export default PromoCodeEndpoints;