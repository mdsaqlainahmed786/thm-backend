"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_1 = __importDefault(require("./admin/user"));
const subscription_plan_1 = __importDefault(require("./admin/subscription-plan"));
const home_1 = __importDefault(require("./admin/home"));
const auth_1 = __importDefault(require("./admin/auth"));
const authenticate_1 = __importStar(require("../../middleware/authenticate"));
const report_1 = __importDefault(require("./admin/report"));
const review_question_1 = __importDefault(require("./admin/review-question"));
const subscription_1 = __importDefault(require("./admin/subscription"));
const post_1 = __importDefault(require("./admin/post"));
const promo_code_1 = __importDefault(require("./admin/promo-code"));
const review_1 = __importDefault(require("./admin/review"));
const HomeController_1 = __importDefault(require("../../controllers/admin/HomeController"));
const AdminApiEndpoints = express_1.default.Router();
AdminApiEndpoints.use('/auth', auth_1.default);
AdminApiEndpoints.get('/business/:id/generate-qr', HomeController_1.default.generateReviewQRCode);
AdminApiEndpoints.use('/', authenticate_1.default, authenticate_1.isAdministrator, home_1.default);
AdminApiEndpoints.use('/users', authenticate_1.default, authenticate_1.isAdministrator, user_1.default);
AdminApiEndpoints.use('/subscriptions', authenticate_1.default, authenticate_1.isAdministrator, subscription_1.default);
AdminApiEndpoints.use('/subscriptions/plans', authenticate_1.default, authenticate_1.isAdministrator, subscription_plan_1.default);
AdminApiEndpoints.use('/reports', authenticate_1.default, authenticate_1.isAdministrator, report_1.default);
AdminApiEndpoints.use('/review-questions', authenticate_1.default, authenticate_1.isAdministrator, review_question_1.default);
AdminApiEndpoints.use('/posts', authenticate_1.default, authenticate_1.isAdministrator, post_1.default);
AdminApiEndpoints.use('/reviews', authenticate_1.default, authenticate_1.isAdministrator, review_1.default);
AdminApiEndpoints.use('/promo-codes', authenticate_1.default, authenticate_1.isAdministrator, promo_code_1.default);
exports.default = AdminApiEndpoints;
