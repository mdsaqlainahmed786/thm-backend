"use strict";
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
exports.fetchBusinessIDs = exports.fetchBusinessProfiles = exports.addUserInBusinessProfile = void 0;
const mongoose_1 = require("mongoose");
const common_model_1 = require("./common.model");
const common_model_2 = require("./common.model");
const basic_1 = require("../../utils/helper/basic");
const user_model_1 = require("./user.model");
const BusinessProfileSchema = new mongoose_1.Schema({
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
    email: { type: String, lowercase: true, required: true, match: [/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, "email is invalid."], },
    // email: { type: String, lowercase: true, index: true, required: true, unique: true, match: [/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, "email is invalid."], },
    phoneNumber: { type: String },
    dialCode: { type: String },
    website: { type: String, default: '' },
    gstn: { type: String, default: '' },
    placeID: { type: String },
    amenities: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "BusinessQuestion"
        }
    ],
    privateAccount: {
        type: Boolean, default: true,
    },
    coverImage: {
        type: String, default: ""
    },
    rating: {
        type: Number, default: 0
    },
}, {
    timestamps: true
});
BusinessProfileSchema.set('toObject', { virtuals: true });
BusinessProfileSchema.set('toJSON', { virtuals: true });
// BusinessProfileSchema.plugin(uniqueValidator);
// Create the Geo spatial index on the coordinates field
BusinessProfileSchema.index({ 'address.geoCoordinate': '2dsphere' });
const BusinessProfile = (0, mongoose_1.model)('BusinessProfile', BusinessProfileSchema);
exports.default = BusinessProfile;
function addUserInBusinessProfile() {
    const lookup = {
        '$lookup': {
            'from': 'users',
            'let': { 'businessProfileID': '$_id' },
            'pipeline': [
                { '$match': { '$expr': { '$eq': ['$businessProfileID', '$$businessProfileID'] } } },
            ],
            'as': 'usersRef'
        }
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$usersRef',
            'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
        }
    };
    return { lookup, unwindLookup };
}
exports.addUserInBusinessProfile = addUserInBusinessProfile;
function fetchBusinessProfiles(match, pageNumber, documentLimit, lat, lng) {
    return __awaiter(this, void 0, void 0, function* () {
        return BusinessProfile.aggregate([
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [lng ? parseFloat(lng.toString()) : 0, lat ? parseFloat(lat.toString()) : 0] },
                    spherical: true,
                    query: match,
                    distanceField: "distance"
                }
            },
            {
                $sort: {
                    distance: -1,
                }
            },
            {
                $match: match
            },
            {
                $limit: documentLimit
            },
            {
                $skip: pageNumber > 0 ? ((pageNumber - 1) * 7) : 0
            },
            (0, user_model_1.addBusinessTypeInBusinessProfile)().lookup,
            (0, user_model_1.addBusinessTypeInBusinessProfile)().unwindLookup,
            (0, user_model_1.addBusinessSubTypeInBusinessProfile)().lookup,
            (0, user_model_1.addBusinessSubTypeInBusinessProfile)().unwindLookup,
            addUserInBusinessProfile().lookup,
            addUserInBusinessProfile().unwindLookup,
            {
                $project: {
                    _id: 1,
                    profilePic: 1,
                    name: 1,
                    address: 1,
                    rating: 1,
                    businessTypeRef: 1,
                    businessSubtypeRef: 1,
                    userID: {
                        '$ifNull': [{ '$ifNull': ['$usersRef._id', ''] }, '']
                    },
                }
            },
        ]);
    });
}
exports.fetchBusinessProfiles = fetchBusinessProfiles;
function fetchBusinessIDs(query, businessTypeID, lat, lng, radius) {
    return __awaiter(this, void 0, void 0, function* () {
        const dbQuery = {};
        const distance = radius || 20;
        let latData = lat ? parseFloat(`${lat}`) : 0;
        let lngData = lng ? parseFloat(`${lng}`) : 0;
        if ((latData != null && latData !== 0 && !isNaN(latData)) && (lngData != null && lngData !== 0 && !isNaN(lngData))) {
            Object.assign(dbQuery, {
                "address.geoCoordinate": {
                    $nearSphere: {
                        $geometry: {
                            type: "Point",
                            coordinates: [lngData, latData] // [longitude, latitude]
                        },
                        $maxDistance: (distance * 1000), // Optional: max distance in meters (5km) = 5000
                        $minDistance: 0
                    }
                },
            });
        }
        if (query && query !== '') {
            Object.assign(dbQuery, {
                $or: [
                    { name: { $regex: new RegExp(query.toLowerCase(), "i") }, },
                    { username: { $regex: new RegExp(query.toLowerCase(), "i") } },
                ]
            });
        }
        if (businessTypeID && (0, basic_1.isString)(businessTypeID)) {
            Object.assign(dbQuery, {
                businessTypeID: businessTypeID
            });
        }
        else if (businessTypeID && (0, basic_1.isArray)(businessTypeID)) {
            Object.assign(dbQuery, {
                businessTypeID: { $in: businessTypeID }
            });
        }
        console.log(lat, lng, radius, businessTypeID, query);
        console.log("Business Search :::", dbQuery);
        return yield BusinessProfile.distinct('_id', dbQuery);
    });
}
exports.fetchBusinessIDs = fetchBusinessIDs;
