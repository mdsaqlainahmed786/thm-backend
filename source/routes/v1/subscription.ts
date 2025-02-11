import express, { Router } from "express";
import SubscriptionController from "../../controllers/SubscriptionController";
import authenticateUser from "../../middleware/authenticate";
const SubscriptionEndpoints: Router = express.Router();
// SubscriptionEndpoints.get("/google/purchases/subscriptions", SubscriptionController.buyInAppSubscription);
SubscriptionEndpoints.post("/google/purchases/subscriptions/verify", authenticateUser, SubscriptionController.verifyGooglePurchase);
SubscriptionEndpoints.post("/google/purchases/subscriptions/notification", SubscriptionController.subscriptionNotification);
// SubscriptionEndpoints.get("/google/purchases/subscription", SubscriptionController.fetchPurchasesSubscriptions);
// SubscriptionEndpoints.post("/validatePayment");


//Final Routing 

export default SubscriptionEndpoints;

//https://medium.com/@rhythm6194/implement-apple-ios-in-app-purchase-receipt-verification-in-node-js-app-server-notification-a10878bae69f
