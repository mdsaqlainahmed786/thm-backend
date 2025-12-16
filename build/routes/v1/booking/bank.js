"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const BankController_1 = __importDefault(require("../../../controllers/BankController"));
const authenticate_1 = __importStar(require("../../../middleware/authenticate"));
const BanksEndpoints = express_1.default.Router();
BanksEndpoints.get('/', BankController_1.default.banks);
BanksEndpoints.get('/accounts', authenticate_1.default, authenticate_1.isBusinessUser, BankController_1.default.index);
BanksEndpoints.post('/accounts', authenticate_1.default, authenticate_1.isBusinessUser, BankController_1.default.store);
BanksEndpoints.patch('/accounts/:id', authenticate_1.default, authenticate_1.isBusinessUser, BankController_1.default.setPrimaryAccount);
BanksEndpoints.delete("/accounts/:id", BankController_1.default.destroy);
// BanksEndpoints.post('/checkout', checkoutApiValidator, validateRequest, BankController.checkout);
// BanksEndpoints.post('/checkout/confirm', confirmCheckoutApiValidator, validateRequest, BankController.confirmCheckout);
// BanksEndpoints.get("/:id/invoice", BankController.downloadInvoice);
exports.default = BanksEndpoints;
