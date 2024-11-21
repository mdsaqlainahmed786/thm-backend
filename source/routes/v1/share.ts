import express, { Router } from "express";
import SearchController from "../../controllers/SearchController";
import ShareController from "../../controllers/ShareController";
const ShareEndpoints: Router = express.Router();
ShareEndpoints.get('/posts', ShareController.posts);
ShareEndpoints.get('/tester', ShareController.tester);
export default ShareEndpoints;