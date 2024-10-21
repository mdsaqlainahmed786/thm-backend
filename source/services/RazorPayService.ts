import Razorpay from "razorpay";
import crypto from "crypto";
import { AppConfig } from "../config/constants";
class RazorPayService {
    private instance: Razorpay;
    constructor() {
        this.instance = new Razorpay({
            key_id: AppConfig.RAZOR_PAY.KEY_ID, // Replace with your Razorpay Key ID
            key_secret: AppConfig.RAZOR_PAY.KEY_SECRET, // Replace with your Razorpay Key Secret
        });
    }
    async createOrder(amount: number, name?: string) {
        try {
            amount = amount * 100;
            const options = {
                amount: amount, // amount in smallest currency unit
                currency: 'INR',
                receipt: 'receipt#1'
            };
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
}


export default RazorPayService;