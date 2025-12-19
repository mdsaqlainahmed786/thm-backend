"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addAnonymousUserInPost = exports.AccountType = exports.SocialAccount = void 0;
const mongoose_1 = require("mongoose");
const common_model_1 = require("./common.model");
const EmailNotificationService_1 = __importDefault(require("../../services/EmailNotificationService"));
const common_model_2 = require("./common.model");
const emailNotificationService = new EmailNotificationService_1.default();
var SocialAccount;
(function (SocialAccount) {
    SocialAccount["FACEBOOK"] = "facebook";
    SocialAccount["GOOGLE"] = "google";
    SocialAccount["APPLE"] = "apple";
})(SocialAccount || (exports.SocialAccount = SocialAccount = {}));
const SocialIDSchema = new mongoose_1.Schema({
    socialUId: { type: String },
    socialType: { type: String, enum: SocialAccount, required: true },
});
var AccountType;
(function (AccountType) {
    AccountType["INDIVIDUAL"] = "individual";
    AccountType["BUSINESS"] = "business";
})(AccountType || (exports.AccountType = AccountType = {}));
const UserSchema = new mongoose_1.Schema({
    bio: { type: String, default: "" },
    profilePic: common_model_1.ProfileSchema,
    username: { type: String },
    businessTypeID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "BusinessType"
    },
    businessSubTypeID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "BusinessSubType"
    },
    name: { type: String, required: true },
    address: common_model_2.AddressSchema,
    email: { type: String, lowercase: true, match: [/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, "email is invalid."], },
    phoneNumber: { type: String },
    dialCode: { type: String },
    website: { type: String },
    gstn: { type: String },
    placeID: { type: String },
    coverImage: {
        type: String, default: ""
    },
    rating: {
        type: Number, default: 0
    },
    accountType: {
        type: String,
        enum: AccountType,
        default: AccountType.INDIVIDUAL
    },
}, {
    timestamps: true
});
UserSchema.index({ 'geoCoordinate': '2dsphere' });
UserSchema.set('toObject', { virtuals: true });
UserSchema.set('toJSON', { virtuals: true });
const AnonymousUser = (0, mongoose_1.model)('AnonymousUser', UserSchema);
exports.default = AnonymousUser;
/**
 *
 * @returns
 * Return posted by public user lookup
 */
function addAnonymousUserInPost() {
    const lookup = {
        '$lookup': {
            'from': 'anonymoususers',
            'let': { 'publicUserID': '$publicUserID' },
            'pipeline': [
                { '$match': { '$expr': { '$eq': ['$_id', '$$publicUserID'] } } },
                {
                    '$project': {
                        "name": 1,
                        "profilePic": 1,
                        "accountType": 1,
                        "businessProfileID": 1,
                        "businessProfileRef._id": 1,
                        "businessProfileRef.name": 1,
                        "businessProfileRef.profilePic": 1,
                        "businessProfileRef.rating": 1,
                        "businessProfileRef.businessTypeRef": 1,
                        "businessProfileRef.businessSubtypeRef": 1,
                        "businessProfileRef.address": 1,
                    }
                }
            ],
            'as': 'publicPostedBy'
        }
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$publicPostedBy',
            'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
        }
    };
    return { lookup, unwindLookup };
}
exports.addAnonymousUserInPost = addAnonymousUserInPost;
