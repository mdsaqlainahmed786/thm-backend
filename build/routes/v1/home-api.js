"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const HomeController_1 = __importDefault(require("../../controllers/HomeController"));
const authenticate_1 = __importDefault(require("../../middleware/authenticate"));
const SubscriptionController_1 = __importDefault(require("../../controllers/SubscriptionController"));
const HomeEndpoints = express_1.default.Router();
HomeEndpoints.get('/db', HomeController_1.default.dbSeeder);
HomeEndpoints.get('/db/s', SubscriptionController_1.default.index);
HomeEndpoints.get('/profile-picture/thumbnail', HomeController_1.default.createThumbnail);
HomeEndpoints.get('/professions', HomeController_1.default.professions);
HomeEndpoints.get('/feed', authenticate_1.default, HomeController_1.default.feed);
HomeEndpoints.get('/transactions', authenticate_1.default, HomeController_1.default.transactions);
HomeEndpoints.get('/suggestions', authenticate_1.default, HomeController_1.default.suggestion);
exports.default = HomeEndpoints;
