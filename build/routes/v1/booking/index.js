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
const amenity_1 = __importDefault(require("./amenity"));
const room_1 = __importDefault(require("./room"));
const booking_1 = __importDefault(require("./booking"));
const authenticate_1 = __importStar(require("../../../middleware/authenticate"));
const hotel_1 = __importDefault(require("../hotel"));
const price_preset_1 = __importDefault(require("./price-preset"));
const BookingEndpoints = express_1.default.Router();
BookingEndpoints.use('/amenities', authenticate_1.default, authenticate_1.isBusinessUser, amenity_1.default);
BookingEndpoints.use('/rooms', authenticate_1.default, room_1.default);
BookingEndpoints.use('/bookings', authenticate_1.default, booking_1.default);
BookingEndpoints.use('/hotels', authenticate_1.default, authenticate_1.isBusinessUser, hotel_1.default);
BookingEndpoints.use('/price-preset', authenticate_1.default, authenticate_1.isBusinessUser, price_preset_1.default);
exports.default = BookingEndpoints;
