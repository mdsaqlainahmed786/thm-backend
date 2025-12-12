"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const EventController_1 = __importDefault(require("../../controllers/EventController"));
const api_validation_1 = require("../../validation/rules/api-validation");
const api_request_validator_1 = require("../../middleware/api-request-validator");
const file_uploading_1 = require("../../middleware/file-uploading");
const EventEndpoints = express_1.default.Router();
EventEndpoints.post('/', file_uploading_1.diskUpload.fields([{ name: 'images', maxCount: 1, }]), api_validation_1.createEventApiValidator, api_request_validator_1.validateRequest, EventController_1.default.store);
EventEndpoints.put('/:id', file_uploading_1.diskUpload.fields([{ name: 'images', maxCount: 1, }]), EventController_1.default.update);
EventEndpoints.post('/join', api_validation_1.joinEventApiValidator, api_request_validator_1.validateRequest, EventController_1.default.joinEvent);
exports.default = EventEndpoints;
