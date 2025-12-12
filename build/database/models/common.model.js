"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationSchema = exports.AddressSchema = exports.ProfileSchema = void 0;
const mongoose_1 = require("mongoose");
exports.ProfileSchema = new mongoose_1.Schema({
    small: {
        type: String,
        default: ""
    },
    medium: {
        type: String,
        default: ""
    },
    large: {
        type: String,
        default: "",
    }
}, {
    _id: false,
});
exports.AddressSchema = new mongoose_1.Schema({
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true },
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
}, { _id: false });
exports.LocationSchema = new mongoose_1.Schema({
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    placeName: { type: String, default: "" },
}, {
    _id: false,
});
