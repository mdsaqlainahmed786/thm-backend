import express, { Router } from "express";
import { param } from "express-validator";
import UserController from "../../../controllers/admin/UserController";
import { paramIDValidationRule, addAdminApiValidator } from "../../../validation/rules/api-validation";
import { validateRequest } from "../../../middleware/api-request-validator";
import { isTheHotelMediaRootAdmin } from "../../../middleware/authenticate";
const UserEndpoints: Router = express.Router();
UserEndpoints.get('/', UserController.index);
// Admin-only: fetch Nth signed-up user (by createdAt asc)
// NOTE: must be registered before '/:id' to avoid route conflicts
UserEndpoints.get(
    '/nth-signup/:n',
    [param('n').isInt({ min: 1 }).withMessage('n must be a positive integer')],
    validateRequest,
    UserController.nthSignupUser
);
// Root-admin-only: fetch ALL administrators
UserEndpoints.get('/fetch-users', isTheHotelMediaRootAdmin, UserController.fetchAllUsers);
UserEndpoints.get('/:id', [paramIDValidationRule], validateRequest, UserController.show);
UserEndpoints.put('/:id', [paramIDValidationRule], validateRequest, UserController.update);
UserEndpoints.post('/add-admin', addAdminApiValidator, validateRequest, UserController.addAdmin);
// Root-admin-only: demote administrator to user
UserEndpoints.put('/:id/demote-admin', isTheHotelMediaRootAdmin, [paramIDValidationRule], validateRequest, UserController.demoteAdmin);
// UserEndpoints.delete('/account', UserController.deleteAccount);
// UserEndpoints.patch('/account/disable', UserController.deactivateAccount);

export default UserEndpoints;