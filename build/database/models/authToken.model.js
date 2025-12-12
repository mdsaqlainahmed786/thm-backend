"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const user_model_1 = require("./user.model");
const AuthTokenSchema = new mongoose_1.Schema({
    userID: { type: mongoose_1.Schema.Types.ObjectId },
    accountType: { type: String, enum: user_model_1.AccountType },
    refreshToken: { type: String, },
    creationDate: { type: Date },
    deviceID: { type: String }
}, {
    timestamps: true
});
const AuthToken = (0, mongoose_1.model)("AuthToken", AuthTokenSchema);
exports.default = AuthToken;
