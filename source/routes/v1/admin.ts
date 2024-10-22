import express, { Router } from "express";
import UserEndpoints from "./admin/user";
import SubscriptionPlanEndpoints from "./admin/subscription";
const AdminApiEndpoints: Router = express.Router();
AdminApiEndpoints.use('/users', UserEndpoints);
AdminApiEndpoints.use('/subscriptions/plans', SubscriptionPlanEndpoints);
export default AdminApiEndpoints;