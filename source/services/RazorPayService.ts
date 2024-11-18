import Razorpay from "razorpay";
import { Orders } from "razorpay/dist/types/orders";
import crypto from "crypto";
import { AppConfig } from "../config/constants";
import { IAddress } from "../database/models/common.model";
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
    private instance: Razorpay;
    constructor() {
        this.instance = new Razorpay({
            key_id: AppConfig.RAZOR_PAY.KEY_ID, // Replace with your Razorpay Key ID
            key_secret: AppConfig.RAZOR_PAY.KEY_SECRET, // Replace with your Razorpay Key Secret
        });
    }
    async createOrder(amount: number, data?: BillingDetails | undefined) {
        try {
            amount = amount * 100;
            const options: Orders.RazorpayOrderBaseRequestBody = {
                amount: amount, // amount in smallest currency unit
                currency: 'INR',
                receipt: 'receipt#1',
                // description: data?.description ?? `Business Subscription`
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
                // Details of the customer's billing address.
                // if (Object.keys(billing_address).length !== 0) {
                //     Object.assign(options, { customer_details: billing_address })
                // }
            }
            console.log(options);
            const order = await this.instance.orders.create(options);
            return order;
        } catch (error) {
            throw error;
        }
    }
    async verifyPayment(order_id: string, payment_id: string, signature: string) {
        const hmac = crypto.createHmac('sha256', AppConfig.RAZOR_PAY.KEY_SECRET);
        hmac.update(order_id + '|' + payment_id);
        const generated_signature = hmac.digest('hex');
        return generated_signature === signature;
    }
    async fetchOrder(orderID: string) {
        try {
            const order = await this.instance.orders.fetch(orderID);
            return order;
        } catch (error) {
            throw error;
        }
    }
    async fetchPayments(orderID: string) {
        try {
            const payments = await this.instance.orders.fetchPayments(orderID);
            return payments;
        } catch (error) {
            throw error;
        }
    }
    async fetchPayment(paymentID: string) {
        try {
            const payment = await this.instance.payments.fetch(paymentID);
            return payment;
        } catch (error) {
            throw error;
        }
    }

}


export default RazorPayService;