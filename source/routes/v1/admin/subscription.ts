import express, { Router } from "express";

import SubscriptionPlanController from "../../../controllers/admin/SubscriptionPlanController";
import { paramIDValidationRule } from "../../../validation/rules/api-validation";
import { validateRequest } from "../../../middleware/api-request-validator";
const SubscriptionPlanEndpoints: Router = express.Router();
SubscriptionPlanEndpoints.get('/', SubscriptionPlanController.index);
SubscriptionPlanEndpoints.get('/:id', [paramIDValidationRule], validateRequest, SubscriptionPlanController.show);
// SubscriptionPlanEndpoints.put('/edit-profile', SubscriptionPlanController.editProfile);
// SubscriptionPlanEndpoints.delete('/account', SubscriptionPlanController.deleteAccount);
// SubscriptionPlanEndpoints.patch('/account/disable', SubscriptionPlanController.deactivateAccount);

export default SubscriptionPlanEndpoints;