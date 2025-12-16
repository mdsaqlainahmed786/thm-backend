"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const constants_1 = require("../config/constants");
const api_1 = __importDefault(require("./v1/api"));
const ApiEndpoint = express_1.default.Router();
ApiEndpoint.use(`${constants_1.AppConfig.API_VERSION}`, api_1.default);
exports.default = ApiEndpoint;
