import express, { Router } from "express";
import AmenityController from "../../../controllers/booking/AmenityController";
import { createAmenityApiValidator, paramIDValidationRule } from "../../../validation/rules/api-validation";
import { validateRequest } from "../../../middleware/api-request-validator";

//FIXME More categorized like Food and Popular Amenities,Parking;
const AmenityEndpoints: Router = express.Router();
AmenityEndpoints.get('/', AmenityController.index);
AmenityEndpoints.post('/', createAmenityApiValidator, validateRequest, AmenityController.store);
AmenityEndpoints.delete('/:id', [paramIDValidationRule], validateRequest, AmenityController.destroy);
AmenityEndpoints.put('/:id', [paramIDValidationRule], validateRequest, AmenityController.update);
AmenityEndpoints.get('/categories', AmenityController.categories);
export default AmenityEndpoints;