import express, { Router } from "express";

import SubscriptionController from "../../../controllers/admin/SubscriptionController";
import { createSubscriptionPlanApiValidator, paramIDValidationRule } from "../../../validation/rules/api-validation";
import { validateRequest } from "../../../middleware/api-request-validator";
const SubscriptionEndpoints: Router = express.Router();
SubscriptionEndpoints.get('/', SubscriptionController.index);
// SubscriptionEndpoints.get('/:id', [paramIDValidationRule], validateRequest, SubscriptionController.show);
// SubscriptionEndpoints.post('/', createSubscriptionPlanApiValidator, validateRequest, SubscriptionController.store);
// SubscriptionEndpoints.delete('/:id', [paramIDValidationRule], validateRequest, SubscriptionController.destroy);
// SubscriptionEndpoints.put('/:id', [paramIDValidationRule], validateRequest, SubscriptionController.update);

export default SubscriptionEndpoints;