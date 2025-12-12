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
exports.fetchCreatedOrder = exports.generateNextOrderID = exports.PaymentDetailSchema = exports.OrderStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const common_model_1 = require("./common.model");
const moment_1 = __importDefault(require("moment"));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["CREATED"] = "order-created";
    OrderStatus["COMPLETED"] = "order-completed";
    OrderStatus["FAILED"] = "order-failed";
    OrderStatus["PAYMENT_PENDING"] = "order-payment-pending";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
exports.PaymentDetailSchema = new mongoose_1.Schema({
    transactionID: {
        type: String,
    },
    paymentMethod: {
        type: String,
    },
    transactionAmount: {
        type: Number,
    }
}, {
    _id: false,
});
const DeliveryAddressSchema = new mongoose_1.Schema({
    address: common_model_1.AddressSchema,
    name: {
        type: String
    },
    phoneNumber: {
        type: String,
    },
    dialCode: {
        type: String,
    },
    gstn: {
        type: String,
    }
}, {
    _id: false
});
const OrderSchema = new mongoose_1.Schema({
    userID: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    orderID: {
        type: String,
        required: true,
        unique: true,
    },
    originalTransactionID: {
        type: String,
    },
    razorPayOrderID: {
        type: String,
        required: true,
        unique: true,
    },
    billingAddress: DeliveryAddressSchema,
    promoCode: {
        type: String,
    },
    promoCodeID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Coupon"
    },
    subscriptionPlanID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Subscription"
    },
    subTotal: {
        type: Number,
        default: 0,
    },
    discount: {
        type: Number,
        default: 0,
    },
    tax: {
        type: Number,
        default: 0,
    },
    grandTotal: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: OrderStatus,
    },
    paymentDetail: exports.PaymentDetailSchema,
}, {
    timestamps: true
});
OrderSchema.set('toObject', { virtuals: true });
OrderSchema.set('toJSON', { virtuals: true });
const Order = mongoose_1.default.model('Order', OrderSchema);
exports.default = Order;
function generateNextOrderID() {
    return __awaiter(this, void 0, void 0, function* () {
        let year = (0, moment_1.default)().get('year');
        let month = (0, moment_1.default)().get('month');
        let date = (0, moment_1.default)().get('date');
        let hour = (0, moment_1.default)().get('hour');
        let minute = (0, moment_1.default)().get('minute');
        let second = (0, moment_1.default)().get('second');
        let millisecond = (0, moment_1.default)().get('millisecond');
        let orderID = `${millisecond}${year}${date}${month}${minute}${second}${hour}`;
        const isAvailable = yield Order.findOne({ orderID: orderID });
        if (!isAvailable) {
            return orderID;
        }
        else {
            return yield generateNextOrderID();
        }
    });
}
exports.generateNextOrderID = generateNextOrderID;
function fetchCreatedOrder(orderID) {
    return Order.findOne({ orderID: orderID, status: OrderStatus.CREATED });
}
exports.fetchCreatedOrder = fetchCreatedOrder;
