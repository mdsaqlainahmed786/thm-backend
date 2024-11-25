import express, { Router } from "express";
import ReportController from "../../../controllers/ReportController";
const ReportEndpoints: Router = express.Router();
ReportEndpoints.get('/', ReportController.index);
export default ReportEndpoints;