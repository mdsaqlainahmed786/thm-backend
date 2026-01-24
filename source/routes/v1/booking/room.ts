import express, { Router } from "express";
import RoomController from "../../../controllers/booking/RoomController";
import { createRoomApiValidator, paramIDValidationRule } from "../../../validation/rules/api-validation";
import { validateRequest } from "../../../middleware/api-request-validator";
import { s3Upload } from "../../../middleware/file-uploading";
import { AwsS3AccessEndpoints } from "../../../config/constants";
import { isBusinessUser } from "../../../middleware/authenticate";
import { wrapMulterMiddleware } from "../../../middleware/multer-error-handler";
const RoomEndpoints: Router = express.Router();

// Create multer middleware instances
// NOTE: use `.any()` to prevent Multer from hard-failing when the client sends
// field names in different formats (e.g., 'images' vs 'images[]' on macOS).
// We enforce field name validation and max count in the controller.
const roomImageUpload = s3Upload(AwsS3AccessEndpoints.ROOMS).any();

RoomEndpoints.get('/', RoomController.index);
RoomEndpoints.get('/:id', [paramIDValidationRule], validateRequest, RoomController.show);
RoomEndpoints.post('/', isBusinessUser, wrapMulterMiddleware(roomImageUpload), createRoomApiValidator, validateRequest, RoomController.store);
RoomEndpoints.delete('/:id', isBusinessUser, [paramIDValidationRule], validateRequest, RoomController.destroy);
RoomEndpoints.put('/:id', isBusinessUser, wrapMulterMiddleware(roomImageUpload), [paramIDValidationRule], validateRequest, RoomController.update);
export default RoomEndpoints;