import express, { Router } from "express";
import RoomImageController from "../../../controllers/booking/RoomImageController";
import { paramIDValidationRule } from "../../../validation/rules/api-validation";
import { validateRequest } from "../../../middleware/api-request-validator";

const RoomImageEndpoints: Router = express.Router();

RoomImageEndpoints.delete('/:id', [paramIDValidationRule], validateRequest, RoomImageController.destroy);

export default RoomImageEndpoints;
