"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchFollowerCount = exports.fetchFollowingCount = exports.fetchUserFollower = exports.fetchUserFollowing = exports.ConnectionStatus = void 0;
const mongoose_1 = require("mongoose");
const user_model_1 = __importStar(require("./user.model"));
var ConnectionStatus;
(function (ConnectionStatus) {
    ConnectionStatus["PENDING"] = "pending";
    ConnectionStatus["ACCEPTED"] = "accepted";
    ConnectionStatus["REJECT"] = "reject";
})(ConnectionStatus || (exports.ConnectionStatus = ConnectionStatus = {}));
const UserConnectionSchema = new mongoose_1.Schema({
    follower: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    following: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
        type: String,
        enum: ConnectionStatus,
        default: ConnectionStatus.PENDING,
    },
}, {
    timestamps: true
});
UserConnectionSchema.set('toObject', { virtuals: true });
UserConnectionSchema.set('toJSON', { virtuals: true });
const UserConnection = (0, mongoose_1.model)("UserConnection", UserConnectionSchema);
exports.default = UserConnection;
function fetchUserFollowing(userID) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield UserConnection.distinct('following', { follower: userID, status: ConnectionStatus.ACCEPTED });
    });
}
exports.fetchUserFollowing = fetchUserFollowing;
function fetchUserFollower(userID) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield UserConnection.distinct('follower', { following: userID, status: ConnectionStatus.ACCEPTED });
    });
}
exports.fetchUserFollower = fetchUserFollower;
function fetchFollowingCount(userID) {
    return __awaiter(this, void 0, void 0, function* () {
        const followerIDs = yield fetchUserFollowing(userID);
        return yield user_model_1.default.find(Object.assign({ _id: { $in: followerIDs } }, user_model_1.activeUserQuery)).countDocuments();
    });
}
exports.fetchFollowingCount = fetchFollowingCount;
function fetchFollowerCount(userID) {
    return __awaiter(this, void 0, void 0, function* () {
        const followingIDs = yield fetchUserFollower(userID);
        return yield user_model_1.default.find(Object.assign({ _id: { $in: followingIDs } }, user_model_1.activeUserQuery)).countDocuments();
    });
}
exports.fetchFollowerCount = fetchFollowerCount;
