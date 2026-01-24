"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const RoomController_1 = __importDefault(require("../../../controllers/booking/RoomController"));
const api_validation_1 = require("../../../validation/rules/api-validation");
const api_request_validator_1 = require("../../../middleware/api-request-validator");
const file_uploading_1 = require("../../../middleware/file-uploading");
const constants_1 = require("../../../config/constants");
const authenticate_1 = require("../../../middleware/authenticate");
const multer_error_handler_1 = require("../../../middleware/multer-error-handler");
const RoomEndpoints = express_1.default.Router();
// Create multer middleware instances
// NOTE: use `.any()` to prevent Multer from hard-failing when the client sends
// field names in different formats (e.g., 'images' vs 'images[]' on macOS).
// We enforce field name validation and max count in the controller.
const roomImageUpload = (0, file_uploading_1.s3Upload)(constants_1.AwsS3AccessEndpoints.ROOMS).any();
RoomEndpoints.get('/', RoomController_1.default.index);
RoomEndpoints.get('/:id', [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, RoomController_1.default.show);
RoomEndpoints.post('/', authenticate_1.isBusinessUser, (0, multer_error_handler_1.wrapMulterMiddleware)(roomImageUpload), api_validation_1.createRoomApiValidator, api_request_validator_1.validateRequest, RoomController_1.default.store);
RoomEndpoints.delete('/:id', authenticate_1.isBusinessUser, [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, RoomController_1.default.destroy);
RoomEndpoints.put('/:id', authenticate_1.isBusinessUser, (0, multer_error_handler_1.wrapMulterMiddleware)(roomImageUpload), [api_validation_1.paramIDValidationRule], api_request_validator_1.validateRequest, RoomController_1.default.update);
exports.default = RoomEndpoints;
