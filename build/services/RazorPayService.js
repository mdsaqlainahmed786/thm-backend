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
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const constants_1 = require("../config/constants");
const uuid_1 = require("uuid");
class RazorPayService {
    constructor() {
        this.instance = new razorpay_1.default({
            key_id: constants_1.AppConfig.RAZOR_PAY.KEY_ID, // Replace with your Razorpay Key ID
            key_secret: constants_1.AppConfig.RAZOR_PAY.KEY_SECRET, // Replace with your Razorpay Key Secret
        });
    }
    createOrder(amount, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                amount = amount * 100;
                const options = {
                    amount: amount, // amount in smallest currency unit
                    currency: 'INR',
                    receipt: (0, uuid_1.v4)(),
                    notes: {
                        description: (data === null || data === void 0 ? void 0 : data.description) ? data === null || data === void 0 ? void 0 : data.description : ''
                    },
                };
                if (data) {
                    let customer_details = {};
                    let billing_address = {};
                    if (data.name) {
                        Object.assign(customer_details, { name: data.name });
                    }
                    if (data.dialCode && data.phoneNumber) {
                        Object.assign(customer_details, { contact: `${data.dialCode}${data.phoneNumber}` });
                    }
                    if (data.email) {
                        Object.assign(customer_details, { email: data.email });
                    }
                    if (data.address && data.address.street) {
                        Object.assign(billing_address, { line1: data.address.street });
                    }
                    if (data.address && data.address.zipCode) {
                        Object.assign(billing_address, { zipcode: data.address.zipCode });
                    }
                    if (data.address && data.address.city) {
                        Object.assign(billing_address, { city: data.address.city });
                    }
                    if (data.address && data.address.state) {
                        Object.assign(billing_address, { state: data.address.state });
                    }
                    if (data.address && data.address.country) {
                        Object.assign(billing_address, { country: data.address.country });
                    }
                    //Customer details 
                    if (Object.keys(customer_details).length !== 0) {
                        Object.assign(options, { customer_details: customer_details });
                    }
                    // Details of the customer's billing address.//TODO Need to be checked
                    if (Object.keys(billing_address).length !== 0) {
                        // Object.assign(options, { customer_details: {billing_address,} })
                    }
                }
                console.log(options);
                const order = yield this.instance.orders.create(options);
                return order;
            }
            catch (error) {
                throw error;
            }
        });
    }
    verifyPayment(order_id, payment_id, signature) {
        return __awaiter(this, void 0, void 0, function* () {
            const hmac = crypto_1.default.createHmac('sha256', constants_1.AppConfig.RAZOR_PAY.KEY_SECRET);
            hmac.update(order_id + '|' + payment_id);
            const generated_signature = hmac.digest('hex');
            return generated_signature === signature;
        });
    }
    fetchOrder(orderID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const order = yield this.instance.orders.fetch(orderID);
                return order;
            }
            catch (error) {
                throw error;
            }
        });
    }
    fetchPayments(orderID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const payments = yield this.instance.orders.fetchPayments(orderID);
                return payments;
            }
            catch (error) {
                throw error;
            }
        });
    }
    fetchPayment(paymentID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const payment = yield this.instance.payments.fetch(paymentID);
                return payment;
            }
            catch (error) {
                throw error;
            }
        });
    }
}
exports.default = RazorPayService;
