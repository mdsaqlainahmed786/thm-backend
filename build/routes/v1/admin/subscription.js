"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const SubscriptionController_1 = __importDefault(require("../../../controllers/admin/SubscriptionController"));
const SubscriptionEndpoints = express_1.default.Router();
SubscriptionEndpoints.get('/', SubscriptionController_1.default.index);
// SubscriptionEndpoints.get('/:id', [paramIDValidationRule], validateRequest, SubscriptionController.show);
// SubscriptionEndpoints.post('/', createSubscriptionPlanApiValidator, validateRequest, SubscriptionController.store);
// SubscriptionEndpoints.delete('/:id', [paramIDValidationRule], validateRequest, SubscriptionController.destroy);
// SubscriptionEndpoints.put('/:id', [paramIDValidationRule], validateRequest, SubscriptionController.update);
exports.default = SubscriptionEndpoints;
