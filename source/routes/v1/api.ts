import express, { Router } from "express";
import HomeEndpoints from "./home-api";
import AuthEndpoint from "./auth";
import UserEndpoints from "./user";
const ApiEndpoints: Router = express.Router();
ApiEndpoints.use('/', HomeEndpoints);
ApiEndpoints.use('/auth', AuthEndpoint);
ApiEndpoints.use('/user', UserEndpoints);
export default ApiEndpoints;