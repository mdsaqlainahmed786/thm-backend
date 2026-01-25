"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const AdminProfileController_1 = __importDefault(require("../../../controllers/admin/AdminProfileController"));
const AdminProfileEndpoints = express_1.default.Router();
// Email update routes
// AdminProfileEndpoints.post('/update-email/initiate', AdminProfileController.initiateEmailUpdate);
// AdminProfileEndpoints.post('/update-email/verify', AdminProfileController.verifyEmailUpdate);
// Password update routes
AdminProfileEndpoints.post('/update-password/initiate', AdminProfileController_1.default.initiatePasswordUpdate);
AdminProfileEndpoints.post('/update-password/verify', AdminProfileController_1.default.verifyPasswordUpdate);
exports.default = AdminProfileEndpoints;
