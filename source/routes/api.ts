import express, { Router, Response, NextFunction } from "express";
import { AppConfig } from "../config/constants";
import ApiEndpoints from "./v1/api";
const ApiEndpoint: Router = express.Router();
ApiEndpoint.use(`${AppConfig.API_VERSION}`, ApiEndpoints);
export default ApiEndpoint;