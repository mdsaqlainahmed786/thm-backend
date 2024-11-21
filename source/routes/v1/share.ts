import express, { Router } from "express";
import SearchController from "../../controllers/SearchController";
const ShareEndpoints: Router = express.Router();
ShareEndpoints.get('/posts', SearchController.index);
export default ShareEndpoints;