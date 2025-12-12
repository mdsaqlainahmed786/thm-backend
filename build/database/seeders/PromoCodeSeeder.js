"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promoCode_model_1 = __importDefault(require("../models/promoCode.model"));
const promoCodes = [
    {
        name: "Welcome 20",
        description: "Get 20% off your first purchase.",
        code: "WELCOME20",
        priceType: "percent",
        value: "20",
        cartValue: 20,
        quantity: -1, //unlimited
        validFrom: '2024-10-17',
        validTo: '2025-10-17',
        redeemedCount: 1,
        maxDiscount: 500,
        type: "subscription"
    },
    {
        name: "Save 150",
        description: "Save 150 on orders of 800 or more.",
        code: "SAVE150",
        priceType: "fixed",
        value: "150",
        cartValue: 800,
        quantity: -1, //unlimited
        validFrom: '2024-10-17',
        validTo: '2025-10-17',
        redeemedCount: 1,
        maxDiscount: 500,
        type: "subscription"
    }
];
class PromoCodeSeeder {
    shouldRun() {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield promoCode_model_1.default.countDocuments().exec();
            return count === 0;
        });
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            return promoCode_model_1.default.create(promoCodes);
        });
    }
}
exports.default = PromoCodeSeeder;
