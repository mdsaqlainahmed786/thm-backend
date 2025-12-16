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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromoType = exports.PriceType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var PriceType;
(function (PriceType) {
    PriceType["FIXED"] = "fixed";
    PriceType["PERCENTAGE"] = "percent";
})(PriceType || (exports.PriceType = PriceType = {}));
var PromoType;
(function (PromoType) {
    PromoType["SUBSCRIPTION"] = "subscription";
    PromoType["BOOKING"] = "booking";
})(PromoType || (exports.PromoType = PromoType = {}));
const PromoCodeSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: ""
    },
    code: {
        type: String,
        required: true,
        unique: true,
    },
    priceType: {
        type: String,
        required: true,
        enum: PriceType
    },
    value: {
        type: Number,
        default: 0
    },
    cartValue: {
        type: Number,
        default: 0
    },
    redeemedCount: {
        type: Number,
        default: 0
    },
    quantity: {
        type: Number,
        default: 0,
    },
    validFrom: {
        type: Date,
        default: Date.now,
    },
    validTo: {
        type: Date,
        default: Date.now,
    },
    maxDiscount: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: PromoType
    }
}, {
    timestamps: true
});
PromoCodeSchema.set('toObject', { virtuals: true });
PromoCodeSchema.set('toJSON', { virtuals: true });
const PromoCode = mongoose_1.default.model('PromoCode', PromoCodeSchema);
exports.default = PromoCode;
