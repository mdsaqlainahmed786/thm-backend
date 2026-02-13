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
        this.instance = null;
        // Validate Razorpay configuration
        if (!constants_1.AppConfig.RAZOR_PAY.KEY_ID || !constants_1.AppConfig.RAZOR_PAY.KEY_SECRET ||
            constants_1.AppConfig.RAZOR_PAY.KEY_ID.trim() === '' || constants_1.AppConfig.RAZOR_PAY.KEY_SECRET.trim() === '') {
            console.error('[RazorPayService] Razorpay API keys are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
            return;
        }
        // Log key ID (first 8 chars) for debugging without exposing full key
        const keyIdPreview = constants_1.AppConfig.RAZOR_PAY.KEY_ID.substring(0, 8) + '...';
        console.log(`[RazorPayService] Initializing Razorpay with Key ID: ${keyIdPreview}`);
        try {
            this.instance = new razorpay_1.default({
                key_id: constants_1.AppConfig.RAZOR_PAY.KEY_ID,
                key_secret: constants_1.AppConfig.RAZOR_PAY.KEY_SECRET,
            });
        }
        catch (error) {
            console.error('[RazorPayService] Failed to initialize Razorpay:', error);
        }
    }
    /**
     * Get diagnostic information about Razorpay configuration (without exposing secrets)
     */
    getDiagnostics() {
        var _a, _b;
        const hasKeyId = !!constants_1.AppConfig.RAZOR_PAY.KEY_ID && constants_1.AppConfig.RAZOR_PAY.KEY_ID.trim() !== '';
        const hasKeySecret = !!constants_1.AppConfig.RAZOR_PAY.KEY_SECRET && constants_1.AppConfig.RAZOR_PAY.KEY_SECRET.trim() !== '';
        const keyIdPreview = hasKeyId ? constants_1.AppConfig.RAZOR_PAY.KEY_ID.substring(0, 8) + '...' : 'NOT SET';
        const keyIdPrefix = hasKeyId ? constants_1.AppConfig.RAZOR_PAY.KEY_ID.substring(0, 4) : '';
        const isTestKey = keyIdPrefix === 'rzp_';
        const isLiveKey = keyIdPrefix === 'rzp_';
        return {
            isInitialized: !!this.instance,
            hasKeyId,
            hasKeySecret,
            keyIdPreview,
            keyIdLength: ((_a = constants_1.AppConfig.RAZOR_PAY.KEY_ID) === null || _a === void 0 ? void 0 : _a.length) || 0,
            keySecretLength: ((_b = constants_1.AppConfig.RAZOR_PAY.KEY_SECRET) === null || _b === void 0 ? void 0 : _b.length) || 0,
            environment: keyIdPrefix === 'rzp_' ? (constants_1.AppConfig.RAZOR_PAY.KEY_ID.includes('test') ? 'TEST' : 'LIVE') : 'UNKNOWN'
        };
    }
    createOrder(amount, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.instance) {
                const diagnostics = this.getDiagnostics();
                console.error('[RazorPayService] Cannot create order - Razorpay not initialized. Diagnostics:', diagnostics);
                throw new Error('Razorpay is not initialized. Please check your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
            }
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
                const diagnostics = this.getDiagnostics();
                console.log('[RazorPayService] Creating order with options:', {
                    amount: options.amount,
                    currency: options.currency,
                    receipt: options.receipt,
                    notes: options.notes,
                    diagnostics: diagnostics
                });
                const order = yield this.instance.orders.create(options);
                console.log('[RazorPayService] Order created successfully:', order.id);
                return order;
            }
            catch (error) {
                const diagnostics = this.getDiagnostics();
                console.error('[RazorPayService] Error creating order:', {
                    statusCode: error.statusCode,
                    error: error.error,
                    message: error.message,
                    diagnostics: diagnostics
                });
                // Provide more helpful error message for 401 errors
                if (error.statusCode === 401) {
                    const helpfulMessage = `Razorpay authentication failed. Please verify:
1. Your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are correct
2. The keys match each other (same key pair)
3. You're using the correct environment (test vs live keys)
4. The keys haven't been revoked in your Razorpay dashboard
Current Key ID: ${diagnostics.keyIdPreview}, Environment: ${diagnostics.environment}`;
                    console.error('[RazorPayService]', helpfulMessage);
                }
                throw error;
            }
        });
    }
    verifyPayment(order_id, payment_id, signature) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!constants_1.AppConfig.RAZOR_PAY.KEY_SECRET || constants_1.AppConfig.RAZOR_PAY.KEY_SECRET.trim() === '') {
                throw new Error('Razorpay KEY_SECRET is not configured');
            }
            const hmac = crypto_1.default.createHmac('sha256', constants_1.AppConfig.RAZOR_PAY.KEY_SECRET);
            hmac.update(order_id + '|' + payment_id);
            const generated_signature = hmac.digest('hex');
            return generated_signature === signature;
        });
    }
    fetchOrder(orderID) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.instance) {
                throw new Error('Razorpay is not initialized. Please check your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
            }
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
            if (!this.instance) {
                throw new Error('Razorpay is not initialized. Please check your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
            }
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
            if (!this.instance) {
                throw new Error('Razorpay is not initialized. Please check your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
            }
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
