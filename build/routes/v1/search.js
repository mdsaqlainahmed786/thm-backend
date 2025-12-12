"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const SearchController_1 = __importDefault(require("../../controllers/SearchController"));
const SearchEndpoints = express_1.default.Router();
SearchEndpoints.get('/', SearchController_1.default.index);
exports.default = SearchEndpoints;
