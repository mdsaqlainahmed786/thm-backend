"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const SubscriptionController_1 = __importDefault(require("../../controllers/SubscriptionController"));
const authenticate_1 = __importDefault(require("../../middleware/authenticate"));
const SubscriptionEndpoints = express_1.default.Router();
// SubscriptionEndpoints.get("/google/purchases/subscriptions", SubscriptionController.buyInAppSubscription);
SubscriptionEndpoints.post("/google/purchases/subscriptions/verify", authenticate_1.default, SubscriptionController_1.default.verifyGooglePurchase);
SubscriptionEndpoints.post("/google/purchases/subscriptions/notification", SubscriptionController_1.default.subscriptionNotification);
// SubscriptionEndpoints.get("/google/purchases/subscription", SubscriptionController.fetchPurchasesSubscriptions);
// SubscriptionEndpoints.post("/validatePayment");
//Final Routing 
exports.default = SubscriptionEndpoints;
//https://medium.com/@rhythm6194/implement-apple-ios-in-app-purchase-receipt-verification-in-node-js-app-server-notification-a10878bae69f
