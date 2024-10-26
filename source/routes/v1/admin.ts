import express, { Router } from "express";
import UserEndpoints from "./admin/user";
import SubscriptionPlanEndpoints from "./admin/subscription";
import HomeEndpoints from "./admin/home";
const AdminApiEndpoints: Router = express.Router();
AdminApiEndpoints.use('', HomeEndpoints);
AdminApiEndpoints.use('/users', UserEndpoints);
AdminApiEndpoints.use('/subscriptions/plans', SubscriptionPlanEndpoints);
export default AdminApiEndpoints;