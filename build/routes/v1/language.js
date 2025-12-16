"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const LanguageController_1 = __importDefault(require("../../controllers/LanguageController"));
const LanguageEndpoints = express_1.default.Router();
LanguageEndpoints.get('/', LanguageController_1.default.index);
exports.default = LanguageEndpoints;
