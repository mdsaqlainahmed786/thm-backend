
import express, { Router } from "express";
import AppNotificationController from "../../controllers/AppNotificationController";

const NotificationEndpoints: Router = express.Router();
NotificationEndpoints.get('/', AppNotificationController.index);
// NotificationEndpoints.get('/get-business/:placeID', authenticateUser, HomeController.getBusinessByPlaceID);

// NotificationEndpoints.get('/business-types', HomeController.businessTypes);
// NotificationEndpoints.get('/business-subtypes/:id', HomeController.businessSubTypes);
// NotificationEndpoints.post('/business-questions', businessQuestionsApiValidator, validateRequest, HomeController.businessQuestions);
// NotificationEndpoints.get('/db', HomeController.dbSeeder);
// NotificationEndpoints.get('/db/s', SubscriptionController.index);
export default NotificationEndpoints;