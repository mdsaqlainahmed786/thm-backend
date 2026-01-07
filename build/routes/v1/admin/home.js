"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const HomeController_1 = __importDefault(require("../../../controllers/admin/HomeController"));
// import { paramIDValidationRule } from "../../../validation/rules/api-validation";
// import { validateRequest } from "../../../middleware/api-request-validator";
const HomeEndpoints = express_1.default.Router();
HomeEndpoints.get('/home', HomeController_1.default.index);
HomeEndpoints.get('/top-reports', HomeController_1.default.topReportedContent);
// HomeEndpoints.get('/business/:id/generate-qr', HomeController.generateReviewQRCode);
exports.default = HomeEndpoints;
