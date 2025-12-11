


import { Schema, Document, model } from "mongoose";
import { MongoID } from "../../common";
export interface IBankAccount extends Document {
    bankName: string;
    bankIcon: string;
    accountNumber: string;
    ifsc: string;
    accountHolder: string;
    type: string;
    isVerified: boolean;
    documents: string[];
    userID: MongoID;
    businessProfileID?: MongoID;
    primaryAccount: boolean;
}
const BankAccountSchema: Schema = new Schema<IBankAccount>(
    {
        bankName: { type: String, required: true },
        bankIcon: { type: String, },
        accountNumber: { type: String, required: true },
        ifsc: { type: String, required: true },
        accountHolder: { type: String, required: true },
        type: { type: String, default: "" },
        isVerified: { type: Boolean, default: false },
        primaryAccount: { type: Boolean, default: false },
        documents: [
            {
                type: String,
            }
        ],
        userID: { type: Schema.Types.ObjectId, ref: "User", required: true },
        businessProfileID: { type: Schema.Types.ObjectId, ref: "BusinessProfile", },
    },
    {
        timestamps: true
    }
);
BankAccountSchema.set('toObject', { virtuals: true });
BankAccountSchema.set('toJSON', { virtuals: true });

export interface IBankAccountModel extends IBankAccount {
}

const BankAccount = model<IBankAccount>('BankAccount', BankAccountSchema);
export default BankAccount;