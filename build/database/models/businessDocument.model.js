"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const AuthTokenSchema = new mongoose_1.Schema({
    addressProof: { type: String, required: true },
    businessRegistration: { type: String, required: true },
    businessProfileID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "BusinessProfile"
    },
}, {
    timestamps: true
});
const BusinessDocument = (0, mongoose_1.model)("BusinessDocument", AuthTokenSchema);
exports.default = BusinessDocument;
