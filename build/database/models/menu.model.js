"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const MenuSchema = new mongoose_1.Schema({
    businessProfileID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "BusinessProfile",
        required: true,
    },
    userID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    mediaID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Media",
        required: true,
    },
}, {
    timestamps: true,
});
MenuSchema.set("toObject", { virtuals: true });
MenuSchema.set("toJSON", { virtuals: true });
const Menu = (0, mongoose_1.model)("Menu", MenuSchema);
exports.default = Menu;
