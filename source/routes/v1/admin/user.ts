import express, { Router } from "express";
import UserController from "../../../controllers/admin/UserController";
import { paramIDValidationRule } from "../../../validation/rules/api-validation";
import { validateRequest } from "../../../middleware/api-request-validator";
const UserEndpoints: Router = express.Router();
UserEndpoints.get('/', UserController.index);
UserEndpoints.get('/:id', [paramIDValidationRule], validateRequest, UserController.show);
UserEndpoints.put('/:id', [paramIDValidationRule], validateRequest, UserController.update);
// UserEndpoints.delete('/account', UserController.deleteAccount);
// UserEndpoints.patch('/account/disable', UserController.deactivateAccount);

export default UserEndpoints;