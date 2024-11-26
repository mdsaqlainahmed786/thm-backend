import express, { Router } from "express";
import UserEndpoints from "./admin/user";
import SubscriptionPlanEndpoints from "./admin/subscription";
import HomeEndpoints from "./admin/home";
import AuthEndpoint from "./admin/auth";
import authenticateUser, { isAdministrator } from "../../middleware/authenticate";
import ReportEndpoints from "./admin/report";
import ReviewQuestionEndpoints from "./admin/review-question";
const AdminApiEndpoints: Router = express.Router();
AdminApiEndpoints.use('/auth', AuthEndpoint);
AdminApiEndpoints.use('/', authenticateUser, isAdministrator, HomeEndpoints);
AdminApiEndpoints.use('/users', authenticateUser, isAdministrator, UserEndpoints);
AdminApiEndpoints.use('/subscriptions/plans', authenticateUser, isAdministrator, SubscriptionPlanEndpoints);
AdminApiEndpoints.use('/reports', authenticateUser, isAdministrator, ReportEndpoints);
AdminApiEndpoints.use('/review-questions', authenticateUser, isAdministrator, ReviewQuestionEndpoints)
export default AdminApiEndpoints;