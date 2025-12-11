import express, { Router } from "express";
import { checkInApiValidator, checkoutApiValidator, createAmenityApiValidator, paramIDValidationRule, confirmCheckoutApiValidator, bookTableApiValidator, bookBanquetApiValidator } from "../../../validation/rules/api-validation";
import { validateRequest } from "../../../middleware/api-request-validator";
import BankController from "../../../controllers/BankController";
import authenticateUser, { isBusinessUser } from "../../../middleware/authenticate";
const BanksEndpoints: Router = express.Router();
BanksEndpoints.get('/', BankController.banks);
BanksEndpoints.get('/accounts', authenticateUser, isBusinessUser, BankController.index);
BanksEndpoints.post('/accounts', authenticateUser, isBusinessUser, BankController.store);
BanksEndpoints.patch('/accounts/:id', authenticateUser, isBusinessUser, BankController.setPrimaryAccount);
BanksEndpoints.delete("/accounts/:id", BankController.destroy);
// BanksEndpoints.post('/checkout', checkoutApiValidator, validateRequest, BankController.checkout);
// BanksEndpoints.post('/checkout/confirm', confirmCheckoutApiValidator, validateRequest, BankController.confirmCheckout);
// BanksEndpoints.get("/:id/invoice", BankController.downloadInvoice);

export default BanksEndpoints;