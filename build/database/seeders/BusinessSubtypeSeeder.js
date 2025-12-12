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
exports.Restaurants = exports.MarriageBanquets = exports.HomeStays = exports.BarsClubs = exports.Hotes = void 0;
const businessType_model_1 = __importDefault(require("../models/businessType.model"));
const businessSubType_model_1 = __importDefault(require("../models/businessSubType.model"));
const BusinessTypeSeeder_1 = require("./BusinessTypeSeeder");
exports.Hotes = ['3 star', '4 star', '5 star'];
exports.BarsClubs = ['Restro Bars', 'Microbreweries', 'Nightclubs', 'Lounge Bars', 'Rooftop Bars'];
exports.HomeStays = ['Traditional', 'Luxury', 'Eco-Friendly', 'Adventure', 'Artistic'];
exports.MarriageBanquets = ['Traditional Banquet Halls', 'Outdoor Gardens and Lawns', 'Luxury Hotel Ballrooms', 'Heritage Venues and Palaces', 'Beach side or Waterfront Venues'];
exports.Restaurants = ['Vegetarian Restaurants', 'Non-Vegetarian Restaurants', 'Mixed Cuisine Restaurants', 'Seafood Restaurants', 'Barbecue (BBQ) Restaurants'];
class BusinessSubtypeSeeder {
    shouldRun() {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield businessSubType_model_1.default.countDocuments().exec();
            return count === 0;
        });
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const businessTypes = yield businessType_model_1.default.find({});
            const data = yield Promise.all(businessTypes.map((businessType) => __awaiter(this, void 0, void 0, function* () {
                //Hotel
                if (businessType.name === BusinessTypeSeeder_1.BusinessTypes[0]) {
                    yield Promise.all(exports.Hotes.map((value) => __awaiter(this, void 0, void 0, function* () {
                        const isExits = yield businessSubType_model_1.default.findOne({ businessTypeID: businessType.id, name: value });
                        if (!isExits) {
                            const newBusinessSubType = new businessSubType_model_1.default();
                            newBusinessSubType.name = value;
                            newBusinessSubType.businessTypeID = businessType.id;
                            yield newBusinessSubType.save();
                        }
                    })));
                }
                //Bars / Clubs
                if (businessType.name === BusinessTypeSeeder_1.BusinessTypes[1]) {
                    yield Promise.all(exports.BarsClubs.map((value) => __awaiter(this, void 0, void 0, function* () {
                        const isExits = yield businessSubType_model_1.default.findOne({ businessTypeID: businessType.id, name: value });
                        if (!isExits) {
                            const newBusinessSubType = new businessSubType_model_1.default();
                            newBusinessSubType.name = value;
                            newBusinessSubType.businessTypeID = businessType.id;
                            yield newBusinessSubType.save();
                        }
                    })));
                }
                //Home Stays
                if (businessType.name === BusinessTypeSeeder_1.BusinessTypes[2]) {
                    yield Promise.all(exports.HomeStays.map((value) => __awaiter(this, void 0, void 0, function* () {
                        const isExits = yield businessSubType_model_1.default.findOne({ businessTypeID: businessType.id, name: value });
                        if (!isExits) {
                            const newBusinessSubType = new businessSubType_model_1.default();
                            newBusinessSubType.name = value;
                            newBusinessSubType.businessTypeID = businessType.id;
                            yield newBusinessSubType.save();
                        }
                    })));
                }
                //Marriage Banquets
                if (businessType.name === BusinessTypeSeeder_1.BusinessTypes[3]) {
                    yield Promise.all(exports.MarriageBanquets.map((value) => __awaiter(this, void 0, void 0, function* () {
                        const isExits = yield businessSubType_model_1.default.findOne({ businessTypeID: businessType.id, name: value });
                        if (!isExits) {
                            const newBusinessSubType = new businessSubType_model_1.default();
                            newBusinessSubType.name = value;
                            newBusinessSubType.businessTypeID = businessType.id;
                            yield newBusinessSubType.save();
                        }
                    })));
                }
                //Restaurant
                if (businessType.name === BusinessTypeSeeder_1.BusinessTypes[4]) {
                    yield Promise.all(exports.Restaurants.map((value) => __awaiter(this, void 0, void 0, function* () {
                        const isExits = yield businessSubType_model_1.default.findOne({ businessTypeID: businessType.id, name: value });
                        if (!isExits) {
                            const newBusinessSubType = new businessSubType_model_1.default();
                            newBusinessSubType.name = value;
                            newBusinessSubType.businessTypeID = businessType.id;
                            yield newBusinessSubType.save();
                        }
                    })));
                }
            })));
            console.log(businessTypes);
            return data;
        });
    }
}
exports.default = BusinessSubtypeSeeder;
