"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const AppNotificationController_1 = __importDefault(require("../../controllers/AppNotificationController"));
const NotificationEndpoints = express_1.default.Router();
NotificationEndpoints.get('/', AppNotificationController_1.default.index);
NotificationEndpoints.get('/status', AppNotificationController_1.default.status);
exports.default = NotificationEndpoints;
