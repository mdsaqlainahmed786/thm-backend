"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const BankAccountSchema = new mongoose_1.Schema({
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
    userID: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    businessProfileID: { type: mongoose_1.Schema.Types.ObjectId, ref: "BusinessProfile", },
}, {
    timestamps: true
});
BankAccountSchema.set('toObject', { virtuals: true });
BankAccountSchema.set('toJSON', { virtuals: true });
const BankAccount = (0, mongoose_1.model)('BankAccount', BankAccountSchema);
exports.default = BankAccount;
