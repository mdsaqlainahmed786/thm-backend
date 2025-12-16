"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ReviewController_1 = __importDefault(require("../../../controllers/admin/ReviewController"));
const ReviewEndpoints = express_1.default.Router();
ReviewEndpoints.get('/', ReviewController_1.default.index);
ReviewEndpoints.delete('/:id', ReviewController_1.default.destroy);
exports.default = ReviewEndpoints;
