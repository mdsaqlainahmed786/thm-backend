
import express, { Router } from "express";
import AppNotificationController from "../../controllers/AppNotificationController";

const NotificationEndpoints: Router = express.Router();
NotificationEndpoints.get('/', AppNotificationController.index);
NotificationEndpoints.get('/status', AppNotificationController.status);
export default NotificationEndpoints;