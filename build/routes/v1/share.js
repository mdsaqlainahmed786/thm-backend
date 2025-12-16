"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ShareController_1 = __importDefault(require("../../controllers/ShareController"));
const ShareEndpoints = express_1.default.Router();
ShareEndpoints.get('/posts', ShareController_1.default.posts);
ShareEndpoints.get('/users', ShareController_1.default.users);
ShareEndpoints.get('/tester', ShareController_1.default.tester);
exports.default = ShareEndpoints;
