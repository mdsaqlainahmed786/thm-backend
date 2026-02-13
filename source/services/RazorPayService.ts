import Razorpay from "razorpay";
import { Orders } from "razorpay/dist/types/orders";
import crypto from "crypto";
import { AppConfig } from "../config/constants";
import { IAddress } from "../database/models/common.model";
import { v4 } from "uuid";
export interface BillingDetails {
    description: string,
    email?: string;
    name: string;
    address: IAddress;
    dialCode: string;
    phoneNumber: string;
    gstn: string;
}

class RazorPayService {
    private instance: Razorpay | null = null;
    constructor() {
        // Validate Razorpay configuration
        if (!AppConfig.RAZOR_PAY.KEY_ID || !AppConfig.RAZOR_PAY.KEY_SECRET || 
            AppConfig.RAZOR_PAY.KEY_ID.trim() === '' || AppConfig.RAZOR_PAY.KEY_SECRET.trim() === '') {
            console.error('[RazorPayService] Razorpay API keys are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
            return;
        }
        
        // Log key ID (first 8 chars) for debugging without exposing full key
        const keyIdPreview = AppConfig.RAZOR_PAY.KEY_ID.substring(0, 8) + '...';
        console.log(`[RazorPayService] Initializing Razorpay with Key ID: ${keyIdPreview}`);
        
        try {
            this.instance = new Razorpay({
                key_id: AppConfig.RAZOR_PAY.KEY_ID,
                key_secret: AppConfig.RAZOR_PAY.KEY_SECRET,
            });
        } catch (error) {
            console.error('[RazorPayService] Failed to initialize Razorpay:', error);
        }
    }
    async createOrder(amount: number, data?: BillingDetails | undefined) {
        if (!this.instance) {
            throw new Error('Razorpay is not initialized. Please check your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
        }
        try {
            amount = amount * 100;
            const options: Orders.RazorpayOrderBaseRequestBody = {
                amount: amount, // amount in smallest currency unit
                currency: 'INR',
                receipt: v4(),
                notes: {
                    description: data?.description ? data?.description : ''
                },
            };
            if (data) {
                let customer_details: Object = {};
                let billing_address: Object = {};
                if (data.name) {
                    Object.assign(customer_details, { name: data.name })
                }
                if (data.dialCode && data.phoneNumber) {
                    Object.assign(customer_details, { contact: `${data.dialCode}${data.phoneNumber}` })
                }
                if (data.email) {
                    Object.assign(customer_details, { email: data.email })
                }


                if (data.address && data.address.street) {
                    Object.assign(billing_address, { line1: data.address.street })
                }
                if (data.address && data.address.zipCode) {
                    Object.assign(billing_address, { zipcode: data.address.zipCode })
                }
                if (data.address && data.address.city) {
                    Object.assign(billing_address, { city: data.address.city })
                }
                if (data.address && data.address.state) {
                    Object.assign(billing_address, { state: data.address.state })
                }
                if (data.address && data.address.country) {
                    Object.assign(billing_address, { country: data.address.country })
                }
                //Customer details 
                if (Object.keys(customer_details).length !== 0) {
                    Object.assign(options, { customer_details: customer_details })
                }
                // Details of the customer's billing address.//TODO Need to be checked
                if (Object.keys(billing_address).length !== 0) {
                    // Object.assign(options, { customer_details: {billing_address,} })
                }
            }
            console.log('[RazorPayService] Creating order with options:', {
                amount: options.amount,
                currency: options.currency,
                receipt: options.receipt,
                notes: options.notes
            });
            const order = await this.instance.orders.create(options);
            console.log('[RazorPayService] Order created successfully:', order.id);
            return order;
        } catch (error: any) {
            console.error('[RazorPayService] Error creating order:', {
                statusCode: error.statusCode,
                error: error.error,
                message: error.message
            });
            throw error;
        }
    }
    async verifyPayment(order_id: string, payment_id: string, signature: string) {
        if (!AppConfig.RAZOR_PAY.KEY_SECRET || AppConfig.RAZOR_PAY.KEY_SECRET.trim() === '') {
            throw new Error('Razorpay KEY_SECRET is not configured');
        }
        const hmac = crypto.createHmac('sha256', AppConfig.RAZOR_PAY.KEY_SECRET);
        hmac.update(order_id + '|' + payment_id);
        const generated_signature = hmac.digest('hex');
        return generated_signature === signature;
    }
    async fetchOrder(orderID: string) {
        if (!this.instance) {
            throw new Error('Razorpay is not initialized. Please check your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
        }
        try {
            const order = await this.instance.orders.fetch(orderID);
            return order;
        } catch (error) {
            throw error;
        }
    }
    async fetchPayments(orderID: string) {
        if (!this.instance) {
            throw new Error('Razorpay is not initialized. Please check your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
        }
        try {
            const payments = await this.instance.orders.fetchPayments(orderID);
            return payments;
        } catch (error) {
            throw error;
        }
    }
    async fetchPayment(paymentID: string) {
        if (!this.instance) {
            throw new Error('Razorpay is not initialized. Please check your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
        }
        try {
            const payment = await this.instance.payments.fetch(paymentID);
            return payment;
        } catch (error) {
            throw error;
        }
    }

}


export default RazorPayService;