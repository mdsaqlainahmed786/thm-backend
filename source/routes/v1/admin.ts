import express, { Router } from "express";
import UserEndpoints from "./admin/user";
const AdminApiEndpoints: Router = express.Router();
AdminApiEndpoints.use('/users', UserEndpoints);
export default AdminApiEndpoints;