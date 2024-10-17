import mongoose, { Schema, Types, Document, Model } from 'mongoose';
import { ObjectId } from 'mongoose';
import { Address, AddressSchema } from './common.model';
import moment from 'moment';
export interface DeliveryInstruction {
    instruction: string;
    remarks: string;
}
export enum OrderStatus {
    ORDER_PLACED = "order-placed"
}


export interface PaymentDetail {
    transactionID: string;
    paymentMethod: string;
    transactionAmount: number;
}
export interface IBillingAddress {
    name: string;
    address: Address;
    dialCode: string;
    phoneNumber: string;
    gstn: string;
}


export interface IOrder extends Document {
    orderID: string;
    userID: Types.ObjectId | string;
    subscriptionID: string;
    billingAddress: IBillingAddress,
    promoCode: string;
    promoCodeID: Types.ObjectId | string;
    subTotal: number;
    grandTotal: number;
    tax: number;
    status: OrderStatus;
    paymentDetail?: PaymentDetail;
    discount: number;
}

const PaymentDetailSchema: Schema = new Schema<PaymentDetail>(
    {
        transactionID: {
            type: String,
        },
        paymentMethod: {
            type: String,
        },
        transactionAmount: {
            type: Number,
        }
    },
    {
        _id: false,
    }
);
const DeliveryAddressSchema: Schema = new Schema<IBillingAddress>(
    {
        address: AddressSchema,
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
    },
    {
        _id: false
    }
);


const OrderSchema: Schema = new Schema<IOrder>(
    {
        userID: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "User"
        },
        orderID: {
            type: String,
            required: true,
            unique: true,
        },
        billingAddress: DeliveryAddressSchema,
        promoCode: {
            type: String,
            ref: "Coupon"
        },
        promoCodeID: {
            type: Schema.Types.ObjectId,
            ref: "Coupon"
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
        paymentDetail: PaymentDetailSchema,
    },
    {
        timestamps: true
    }
);
OrderSchema.set('toObject', { virtuals: true });
OrderSchema.set('toJSON', { virtuals: true });



export interface IOrderModel extends IOrder {
}
const Order = mongoose.model<IOrderModel>('Order', OrderSchema);
export default Order;

export async function generateNextOrderID(): Promise<string> {
    let year = moment().get('year');
    let month = moment().get('month');
    let date = moment().get('date');
    let hour = moment().get('hour');
    let minute = moment().get('minute');
    let second = moment().get('second');
    let millisecond = moment().get('millisecond');
    let orderID = `${millisecond}${minute}${second}${hour}`;
    const isAvailable = await Order.findOne({ orderID: orderID });
    if (!isAvailable) {
        return orderID;
    } else {
        return await generateNextOrderID();
    }
}





