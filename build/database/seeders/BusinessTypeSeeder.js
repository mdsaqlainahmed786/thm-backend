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
exports.BusinessTypes = exports.BusinessType = void 0;
const businessType_model_1 = __importDefault(require("../models/businessType.model"));
var BusinessType;
(function (BusinessType) {
    BusinessType["HOTEL"] = "Hotel";
    BusinessType["BARS_CLUBS"] = "Bars / Clubs";
    BusinessType["HOME_STAYS"] = "Home Stays";
    BusinessType["MARRIAGE_BANQUETS"] = "Marriage Banquets";
    BusinessType["RESTAURANT"] = "Restaurant";
})(BusinessType || (exports.BusinessType = BusinessType = {}));
exports.BusinessTypes = Object.values(BusinessType);
class BusinessTypeSeeder {
    constructor(hostAddress) {
        this.hostAddress = hostAddress;
    }
    shouldRun() {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield businessType_model_1.default.countDocuments().exec();
            return count === 0;
        });
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const BusinessIcons = [
                this.hostAddress + '/public/files/hotel.png',
                this.hostAddress + '/public/files/bars-clubs.png',
                this.hostAddress + '/public/files/home-stay.png',
                this.hostAddress + '/public/files/marriage-banquets.png',
                this.hostAddress + '/public/files/restaurant.png'
            ];
            return yield Promise.all(exports.BusinessTypes.map((businessType, index) => __awaiter(this, void 0, void 0, function* () {
                const isExits = yield businessType_model_1.default.findOne({ name: businessType });
                if (!isExits) {
                    const newBusinessType = new businessType_model_1.default({
                        icon: BusinessIcons[index],
                        name: businessType,
                    });
                    return yield newBusinessType.save();
                }
                return isExits;
            })));
        });
    }
}
exports.default = BusinessTypeSeeder;
