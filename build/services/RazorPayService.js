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
        var _a, _b;
        this.instance = null;
        // Validate Razorpay configuration
        const keyId = ((_a = constants_1.AppConfig.RAZOR_PAY.KEY_ID) === null || _a === void 0 ? void 0 : _a.trim()) || '';
        const keySecret = ((_b = constants_1.AppConfig.RAZOR_PAY.KEY_SECRET) === null || _b === void 0 ? void 0 : _b.trim()) || '';
        // Debug: Log what we're actually reading (safely)
        console.log('[RazorPayService] Reading environment variables:');
        const rawKeyId = process.env.RAZORPAY_KEY_ID || '';
        const rawKeySecret = process.env.RAZORPAY_KEY_SECRET || '';
        console.log(`[RazorPayService] Raw KEY_ID from env: ${rawKeyId ? rawKeyId.substring(0, 8) + '... (length: ' + rawKeyId.length + ', hasQuotes: ' + (rawKeyId.includes('"') || rawKeyId.includes("'")) + ')' : 'NOT SET'}`);
        console.log(`[RazorPayService] Raw KEY_SECRET from env: length: ${rawKeySecret.length}, hasQuotes: ${rawKeySecret.includes('"') || rawKeySecret.includes("'")}, firstChars: ${rawKeySecret.substring(0, 4)}, lastChars: ${rawKeySecret.substring(Math.max(0, rawKeySecret.length - 4))}`);
        console.log(`[RazorPayService] After processing - KEY_ID length: ${keyId.length}, KEY_SECRET length: ${keySecret.length}`);
        // Check for truncation issues
        if (rawKeySecret.length !== keySecret.length) {
            console.warn(`[RazorPayService] WARNING: Key secret length changed after processing! Raw: ${rawKeySecret.length}, Processed: ${keySecret.length}`);
        }
        if (!keyId || !keySecret) {
            console.error('[RazorPayService] Razorpay API keys are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
            return;
        }
        // Validate key lengths (Razorpay keys have specific length requirements)
        // KEY_ID: typically 20-25 characters (rzp_test_... or rzp_live_...)
        // KEY_SECRET: typically 32+ characters, but some older test keys might be shorter
        if (keyId.length < 20 || keyId.length > 30) {
            console.warn(`[RazorPayService] KEY_ID length (${keyId.length}) seems unusual. Expected 20-30 characters.`);
        }
        // Check for common issues
        if (keySecret.includes('"') || keySecret.includes("'")) {
            console.error(`[RazorPayService] KEY_SECRET appears to contain quotes! This suggests the .env file may have quotes that weren't stripped.`);
            console.error(`[RazorPayService] Current KEY_SECRET value (first 10 chars): ${keySecret.substring(0, 10)}...`);
        }
        // Check if this is a live key
        const isLiveKey = keyId.includes('live');
        const isTestKey = keyId.includes('test');
        // Warn if key is shorter than expected, but allow it to proceed
        // Razorpay will validate the key when we try to use it
        if (keySecret.length < 32) {
            if (isLiveKey) {
                console.warn(`[RazorPayService] LIVE KEY_SECRET length (${keySecret.length}) is shorter than typical (usually 32+).`);
                console.warn(`[RazorPayService] Proceeding anyway - Razorpay will validate when we use it.`);
                // Don't block initialization - let Razorpay API tell us if it's invalid
            }
            else {
                console.warn(`[RazorPayService] KEY_SECRET length (${keySecret.length}) is shorter than expected (typically 32+ characters).`);
                console.warn(`[RazorPayService] If authentication fails, verify the complete key in your Razorpay dashboard.`);
            }
        }
        if (keySecret.length > 50) {
            console.warn(`[RazorPayService] KEY_SECRET length (${keySecret.length}) seems unusually long. Expected 32-40 characters.`);
        }
        // Log key ID (first 8 chars) for debugging without exposing full key
        const keyIdPreview = keyId.substring(0, 8) + '...';
        const keyType = isLiveKey ? 'LIVE' : (isTestKey ? 'TEST' : 'UNKNOWN');
        console.log(`[RazorPayService] Initializing Razorpay ${keyType} mode with Key ID: ${keyIdPreview}, Key lengths - ID: ${keyId.length}, Secret: ${keySecret.length}`);
        try {
            this.instance = new razorpay_1.default({
                key_id: keyId,
                key_secret: keySecret,
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
        const keyId = ((_a = constants_1.AppConfig.RAZOR_PAY.KEY_ID) === null || _a === void 0 ? void 0 : _a.trim()) || '';
        const keySecret = ((_b = constants_1.AppConfig.RAZOR_PAY.KEY_SECRET) === null || _b === void 0 ? void 0 : _b.trim()) || '';
        const hasKeyId = keyId !== '';
        const hasKeySecret = keySecret !== '';
        const keyIdPreview = hasKeyId ? keyId.substring(0, 8) + '...' : 'NOT SET';
        const keyIdPrefix = hasKeyId ? keyId.substring(0, 4) : '';
        const isTestKey = keyId.includes('test');
        const isLiveKey = keyId.includes('live');
        // Check if key lengths are valid (note: some older test keys might be shorter)
        const keyIdLengthValid = hasKeyId && keyId.length >= 20 && keyId.length <= 30;
        const keySecretLengthValid = hasKeySecret && keySecret.length >= 32;
        const keySecretLengthWarning = hasKeySecret && keySecret.length < 32 && keySecret.length >= 20;
        let warning = null;
        if (!keySecretLengthValid && keySecretLengthWarning) {
            warning = 'KEY_SECRET is shorter than typical (25 chars vs expected 32+). Verify complete key in Razorpay dashboard.';
        }
        else if (!keySecretLengthValid) {
            warning = 'KEY_SECRET is too short (expected >= 32 chars)';
        }
        else if (!keyIdLengthValid) {
            warning = 'KEY_ID length seems unusual';
        }
        return {
            isInitialized: !!this.instance,
            hasKeyId,
            hasKeySecret,
            keyIdPreview,
            keyIdLength: keyId.length,
            keySecretLength: keySecret.length,
            keyIdLengthValid,
            keySecretLengthValid,
            keySecretLengthWarning,
            environment: isTestKey ? 'TEST' : (isLiveKey ? 'LIVE' : 'UNKNOWN'),
            warning
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
                    let helpfulMessage = `Razorpay authentication failed. Please verify:\n`;
                    helpfulMessage += `1. Your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are correct\n`;
                    helpfulMessage += `2. The keys match each other (same key pair)\n`;
                    helpfulMessage += `3. You're using the correct environment (test vs live keys)\n`;
                    helpfulMessage += `4. The keys haven't been revoked in your Razorpay dashboard\n`;
                    helpfulMessage += `Current Key ID: ${diagnostics.keyIdPreview}, Environment: ${diagnostics.environment}\n`;
                    helpfulMessage += `Key lengths - ID: ${diagnostics.keyIdLength}, Secret: ${diagnostics.keySecretLength}`;
                    if (diagnostics.warning) {
                        helpfulMessage += `\n⚠️  WARNING: ${diagnostics.warning}`;
                        helpfulMessage += `\nThis is likely the cause of the authentication failure!`;
                    }
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
