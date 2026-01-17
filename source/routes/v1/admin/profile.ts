import express, { Router } from "express";
import AdminProfileController from "../../../controllers/admin/AdminProfileController";

const AdminProfileEndpoints: Router = express.Router();

// Email update routes
AdminProfileEndpoints.post('/update-email/initiate', AdminProfileController.initiateEmailUpdate);
AdminProfileEndpoints.post('/update-email/verify', AdminProfileController.verifyEmailUpdate);

// Password update routes
AdminProfileEndpoints.post('/update-password/initiate', AdminProfileController.initiatePasswordUpdate);
AdminProfileEndpoints.post('/update-password/verify', AdminProfileController.verifyPasswordUpdate);

export default AdminProfileEndpoints;
