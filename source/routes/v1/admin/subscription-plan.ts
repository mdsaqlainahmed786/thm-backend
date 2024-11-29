import express, { Router } from "express";

import SubscriptionPlanController from "../../../controllers/admin/SubscriptionPlanController";
import { createSubscriptionPlanApiValidator, paramIDValidationRule } from "../../../validation/rules/api-validation";
import { validateRequest } from "../../../middleware/api-request-validator";
const SubscriptionPlanEndpoints: Router = express.Router();
SubscriptionPlanEndpoints.get('/', SubscriptionPlanController.index);
SubscriptionPlanEndpoints.get('/:id', [paramIDValidationRule], validateRequest, SubscriptionPlanController.show);
SubscriptionPlanEndpoints.post('/', createSubscriptionPlanApiValidator, validateRequest, SubscriptionPlanController.store);
SubscriptionPlanEndpoints.delete('/:id', [paramIDValidationRule], validateRequest, SubscriptionPlanController.destroy);
SubscriptionPlanEndpoints.put('/:id', [paramIDValidationRule], validateRequest, SubscriptionPlanController.update);

export default SubscriptionPlanEndpoints;