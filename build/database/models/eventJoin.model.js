"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const AuthTokenSchema = new mongoose_1.Schema({
    postID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Post",
        required: true,
    },
    userID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, {
    timestamps: true
});
const EventJoin = (0, mongoose_1.model)("EventJoin", AuthTokenSchema);
exports.default = EventJoin;
