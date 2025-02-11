
import express, { Router } from "express";
import HomeController from "../../controllers/HomeController";
import authenticateUser from "../../middleware/authenticate";
import SubscriptionController from "../../controllers/SubscriptionController";
const HomeEndpoints: Router = express.Router();
HomeEndpoints.get('/db', HomeController.dbSeeder);
HomeEndpoints.get('/db/s', SubscriptionController.index);
HomeEndpoints.get('/profile-picture/thumbnail', HomeController.createThumbnail);
HomeEndpoints.get('/professions', HomeController.professions);
HomeEndpoints.get('/feed', authenticateUser, HomeController.feed);
HomeEndpoints.get('/transactions', authenticateUser, HomeController.transactions);
HomeEndpoints.get('/suggestions', authenticateUser, HomeController.suggestion);
export default HomeEndpoints;