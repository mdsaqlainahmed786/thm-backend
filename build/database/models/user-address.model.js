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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const UserAddressSchema = new mongoose_1.Schema({
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true },
    phoneNumber: {
        type: String, match: [/^\d{1,14}$/]
    },
    dialCode: {
        type: String, match: [/^\+\d{1,3}$/],
    },
    userID: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    geoCoordinate: {
        type: {
            type: String,
            enum: ['Point'], // Specify the type as "Point" for geo spatial indexing
        },
        coordinates: {
            type: [Number],
        }
    },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
}, {
    timestamps: true
});
UserAddressSchema.set('toObject', { virtuals: true });
UserAddressSchema.set('toJSON', { virtuals: true });
UserAddressSchema.index({ 'geoCoordinate': '2dsphere' });
const UserAddress = mongoose_1.default.model('UserAddress', UserAddressSchema);
exports.default = UserAddress;
