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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSavedPost = exports.getPostsCount = exports.getPostQuery = exports.countPostDocument = exports.fetchPosts = exports.imJoining = exports.isSavedByMe = exports.isLikedByMe = exports.addInterestedPeopleInPost = exports.addGoogleReviewedBusinessProfileInPost = exports.addReviewedBusinessProfileInPost = exports.addMediaInPost = exports.addTaggedPeopleInPost = exports.addPostedByInPost = exports.ReviewSchema = exports.PostType = void 0;
const mongoose_1 = require("mongoose");
const mongodb_1 = require("mongodb");
const like_model_1 = require("./like.model");
const comment_model_1 = require("./comment.model");
const savedPost_model_1 = __importDefault(require("./savedPost.model"));
const common_model_1 = require("./common.model");
var PostType;
(function (PostType) {
    PostType["POST"] = "post";
    PostType["REVIEW"] = "review";
    PostType["EVENT"] = "event";
})(PostType || (exports.PostType = PostType = {}));
var MediaType;
(function (MediaType) {
    MediaType["IMAGE"] = "image";
    MediaType["VIDEO"] = "video";
    // CAROUSEL = "carousel",
})(MediaType || (MediaType = {}));
exports.ReviewSchema = new mongoose_1.Schema({
    questionID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User"
    },
    rating: { type: Number, default: 0 },
}, {
    _id: false,
});
const PostSchema = new mongoose_1.Schema({
    userID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User"
    },
    businessProfileID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "BusinessProfile"
    },
    reviewedBusinessProfileID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "BusinessProfile"
    },
    googleReviewedBusiness: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "AnonymousUser"
    },
    publicUserID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "AnonymousUser"
    },
    content: {
        type: String,
    },
    postType: {
        type: String,
        enum: PostType,
        required: true,
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    location: common_model_1.LocationSchema,
    media: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Media"
        }],
    tagged: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "User"
        }],
    feelings: {
        type: String,
        default: ''
    },
    rating: {
        type: Number,
    },
    placeID: {
        type: String,
    },
    reviews: [exports.ReviewSchema],
    name: { type: String, },
    startDate: { type: String, },
    startTime: { type: String, },
    endDate: { type: String, },
    endTime: { type: String, },
    type: { type: String, },
    streamingLink: { type: String, },
    venue: { type: String, },
    geoCoordinate: {
        type: {
            type: String,
            enum: ['Point'], // Specify the type as "Point" for geo spatial indexing
        },
        coordinates: {
            type: [Number],
        }
    },
    views: { type: Number },
    collaborators: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    collaborationInvites: [
        {
            invitedUserID: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
            status: {
                type: String,
                enum: ["pending", "accepted", "declined"],
                default: "pending",
            },
            invitedAt: { type: Date, default: Date.now },
            respondedAt: { type: Date },
        },
    ],
    // rest unchanged...
}, {
    timestamps: true
});
PostSchema.index({ 'geoCoordinate': '2dsphere' });
PostSchema.set('toObject', { virtuals: true });
PostSchema.set('toJSON', { virtuals: true });
const Post = (0, mongoose_1.model)('Post', PostSchema);
exports.default = Post;
const user_model_1 = require("./user.model");
const businessProfile_model_1 = require("./businessProfile.model");
const anonymousUser_model_1 = require("./anonymousUser.model");
/**
 *
 * @returns
 * Return posted by user lookup
 */
function addPostedByInPost() {
    const lookup = {
        '$lookup': {
            'from': 'users',
            'let': { 'userID': '$userID' },
            'pipeline': [
                { '$match': { '$expr': { '$eq': ['$_id', '$$userID'] } } },
                (0, user_model_1.addBusinessProfileInUser)().lookup,
                (0, user_model_1.addBusinessProfileInUser)().unwindLookup,
                (0, user_model_1.addBusinessSubTypeInBusinessProfile)().lookup,
                (0, user_model_1.addBusinessSubTypeInBusinessProfile)().unwindLookup,
                {
                    '$project': {
                        "name": 1,
                        "profilePic": 1,
                        "accountType": 1,
                        "privateAccount": 1,
                        "businessProfileID": 1,
                        "businessProfileRef._id": 1,
                        "businessProfileRef.name": 1,
                        "businessProfileRef.profilePic": 1,
                        "businessProfileRef.rating": 1,
                        "businessProfileRef.privateAccount": 1,
                        "businessProfileRef.businessTypeRef": 1,
                        "businessProfileRef.businessSubtypeRef": 1,
                        "businessProfileRef.address": 1,
                    }
                }
            ],
            'as': 'postedBy'
        }
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$postedBy',
            'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
        }
    };
    return { lookup, unwindLookup };
}
exports.addPostedByInPost = addPostedByInPost;
/**
 *
 * @returns
 * Return tagged people reference in post
 */
function addTaggedPeopleInPost() {
    const lookup = {
        '$lookup': {
            'from': 'users',
            'let': { 'taggedID': '$tagged' },
            'pipeline': [
                { '$match': { '$expr': { '$in': ['$_id', '$$taggedID'] } } },
                (0, user_model_1.addBusinessProfileInUser)().lookup,
                (0, user_model_1.addBusinessProfileInUser)().unwindLookup,
                {
                    '$project': {
                        "name": 1,
                        "profilePic": 1,
                        "accountType": 1,
                        'username': 1,
                        "businessProfileID": 1,
                        "businessProfileRef._id": 1,
                        "businessProfileRef.name": 1,
                        "businessProfileRef.profilePic": 1,
                        "businessProfileRef.businessTypeRef": 1,
                    }
                }
            ],
            'as': 'taggedRef'
        }
    };
    return { lookup };
}
exports.addTaggedPeopleInPost = addTaggedPeopleInPost;
/**
 *
 * @returns
 * Return total media reference in post
 */
function addMediaInPost() {
    const lookup = {
        '$lookup': {
            'from': 'media',
            'let': { 'mediaIDs': '$media' },
            'pipeline': [
                { '$match': { '$expr': { '$in': ['$_id', '$$mediaIDs'] } } },
                {
                    '$project': {
                        "userID": 0,
                        "fileName": 0,
                        "width": 0,
                        "height": 0,
                        "fileSize": 0,
                        "s3Key": 0,
                        "createdAt": 0,
                        "updatedAt": 0,
                        "__v": 0
                    }
                }
            ],
            'as': 'mediaRef'
        }
    };
    const sort_media = {
        $addFields: {
            mediaRef: {
                $sortArray: { input: "$mediaRef", sortBy: { _id: 1 } }
            },
        }
    };
    return { lookup, sort_media };
}
exports.addMediaInPost = addMediaInPost;
/**
 *
 * @returns
 * Return Business Profile
 */
function addReviewedBusinessProfileInPost() {
    const lookup = {
        '$lookup': {
            'from': 'businessprofiles',
            'let': { 'reviewedBusinessProfileID': '$reviewedBusinessProfileID' },
            'pipeline': [
                { '$match': { '$expr': { '$eq': ['$_id', '$$reviewedBusinessProfileID'] } } },
                (0, user_model_1.addBusinessTypeInBusinessProfile)().lookup,
                (0, user_model_1.addBusinessTypeInBusinessProfile)().unwindLookup,
                (0, user_model_1.addBusinessSubTypeInBusinessProfile)().lookup,
                (0, user_model_1.addBusinessSubTypeInBusinessProfile)().unwindLookup,
                (0, businessProfile_model_1.addUserInBusinessProfile)().lookup,
                (0, businessProfile_model_1.addUserInBusinessProfile)().unwindLookup,
                {
                    '$project': {
                        "userID": {
                            '$ifNull': [{ '$ifNull': ['$usersRef._id', ''] }, '']
                        },
                        "profilePic": 1,
                        "address": 1,
                        "name": 1,
                        "coverImage": 1,
                        "rating": 1,
                        "businessTypeRef": 1,
                        "businessSubtypeRef": 1,
                    }
                }
            ],
            'as': 'reviewedBusinessProfileRef'
        }
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$reviewedBusinessProfileRef',
            'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
        }
    };
    return { lookup, unwindLookup };
}
exports.addReviewedBusinessProfileInPost = addReviewedBusinessProfileInPost;
function addGoogleReviewedBusinessProfileInPost() {
    const lookup = {
        '$lookup': {
            'from': 'anonymoususers',
            'let': { 'googleReviewedBusiness': '$googleReviewedBusiness' },
            'pipeline': [
                { '$match': { '$expr': { '$eq': ['$_id', '$$googleReviewedBusiness'] } } },
                (0, user_model_1.addBusinessTypeInBusinessProfile)().lookup,
                (0, user_model_1.addBusinessTypeInBusinessProfile)().unwindLookup,
                (0, user_model_1.addBusinessSubTypeInBusinessProfile)().lookup,
                (0, user_model_1.addBusinessSubTypeInBusinessProfile)().unwindLookup,
                {
                    '$project': {
                        "userID": "",
                        "profilePic": 1,
                        "address": 1,
                        "name": 1,
                        "coverImage": 1,
                        "rating": 1,
                        "businessTypeRef": 1,
                        "businessSubtypeRef": 1,
                    }
                }
            ],
            'as': 'googleReviewedBusinessRef'
        }
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$googleReviewedBusinessRef',
            'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
        }
    };
    return { lookup, unwindLookup };
}
exports.addGoogleReviewedBusinessProfileInPost = addGoogleReviewedBusinessProfileInPost;
/**
 *
 * @returns
 * Return interested people count which is interested to join event
 */
function addInterestedPeopleInPost() {
    const lookup = {
        $lookup: {
            from: 'eventjoins',
            let: { postID: '$_id' },
            pipeline: [
                { $match: { $expr: { $eq: ['$postID', '$$postID'] } } },
                {
                    '$lookup': {
                        'from': 'users',
                        'let': { 'userID': '$userID' },
                        'pipeline': [
                            { '$match': { '$expr': { '$eq': ['$_id', '$$userID'] } } },
                            (0, user_model_1.addBusinessProfileInUser)().lookup,
                            (0, user_model_1.addBusinessProfileInUser)().unwindLookup,
                            {
                                '$replaceRoot': {
                                    'newRoot': {
                                        '$mergeObjects': ["$$ROOT", "$businessProfileRef"] // Merge businessProfileRef with the user object
                                    }
                                }
                            },
                            {
                                '$project': {
                                    "_id": 0,
                                    "profilePic": 1,
                                }
                            }
                        ],
                        'as': 'usersRef'
                    }
                },
                {
                    '$unwind': {
                        'path': '$usersRef',
                        'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
                    }
                },
                {
                    '$replaceRoot': {
                        'newRoot': {
                            '$mergeObjects': ["$$ROOT", "$usersRef"] // Merge businessProfileRef with the user object
                        }
                    }
                },
                {
                    '$project': {
                        "_id": 0,
                        "userID": 1,
                        "profilePic": 1,
                    }
                }
            ],
            as: 'eventJoinsRef'
        },
    };
    const addInterestedCount = {
        $addFields: {
            interestedPeople: { $cond: { if: { $isArray: "$eventJoinsRef" }, then: { $size: "$eventJoinsRef" }, else: 0 } }
        }
    };
    return { lookup, addInterestedCount };
}
exports.addInterestedPeopleInPost = addInterestedPeopleInPost;
function isLikedByMe(likedByMe) {
    return {
        $addFields: {
            likedByMe: {
                $in: ['$_id', likedByMe]
            },
        }
    };
}
exports.isLikedByMe = isLikedByMe;
function isSavedByMe(savedByMe) {
    return {
        $addFields: {
            savedByMe: {
                $in: ['$_id', savedByMe]
            },
        }
    };
}
exports.isSavedByMe = isSavedByMe;
function imJoining(joiningEvents) {
    return {
        $addFields: {
            imJoining: {
                $in: ['$_id', joiningEvents]
            },
        }
    };
}
exports.imJoining = imJoining;
/**
 *
 * @param match  Used in an aggregation pipeline to filter documents.
 * @param likedByMe To check which post request user liked or not
 * @param savedByMe To check which post request user saved or not
 * @param pageNumber Page number
 * @param documentLimit Return document limit
 * @returns
 *
 * This will return post with like and comment count and also determine post saved or liked by requested user
 */
function locationBased(lat, lng) {
    if (lat !== 0 && lng !== 0) {
        const sort = {
            $sort: {
                sortDate: -1,
                distance: 1,
            }
        };
        return { sort };
    }
    else {
        const sort = {
            $sort: {
                createdAt: -1,
                id: 1
            }
        };
        return { sort };
    }
}
function fetchPosts(match, likedByMe, savedByMe, joiningEvents, pageNumber, documentLimit, lat, lng, skipPrivateAccountFilter, followedUserIDs, currentUserID) {
    lng = lng ? parseFloat(lng.toString()) : 0;
    lat = lat ? parseFloat(lat.toString()) : 0;
    // Convert followedUserIDs to ObjectIds for comparison
    // Ensure followedUserIDs is an array before mapping
    const followedUserObjectIds = (followedUserIDs && Array.isArray(followedUserIDs))
        ? followedUserIDs.map(id => new mongodb_1.ObjectId(id))
        : [];
    // Convert currentUserID to ObjectId for comparison
    const currentUserObjectId = currentUserID ? new mongodb_1.ObjectId(currentUserID) : null;
    // Build the aggregation pipeline
    const pipeline = [
        {
            $geoNear: {
                near: { type: "Point", coordinates: [lng, lat] },
                spherical: true,
                query: match,
                distanceField: "distance"
            }
        },
        {
            $addFields: {
                distance: { $toInt: "$distance" },
                sortDate: {
                    $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$createdAt"
                    }
                }
            }
        },
        locationBased(lat, lng).sort,
        // {
        //     $sort: {
        //         sortDate: -1, distance: 1,
        //     }
        // },
        {
            $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
        },
        {
            $limit: documentLimit
        },
        addMediaInPost().lookup,
        addMediaInPost().sort_media,
        addTaggedPeopleInPost().lookup,
        addPostedByInPost().lookup,
        addPostedByInPost().unwindLookup,
    ];
    // Conditionally add private account filter
    if (!skipPrivateAccountFilter) {
        // Build filter conditions
        const privateAccountConditions = [
            { "postedBy.privateAccount": { $ne: true } },
            { "postedBy.privateAccount": { $exists: false } }
        ];
        // Allow posts from private accounts that are being followed
        if (followedUserObjectIds.length > 0) {
            privateAccountConditions.push({
                $and: [
                    { "postedBy.privateAccount": true },
                    { "postedBy._id": { $in: followedUserObjectIds } }
                ]
            });
        }
        // Allow user's own posts even if their account is private
        if (currentUserObjectId) {
            privateAccountConditions.push({
                $and: [
                    { "postedBy.privateAccount": true },
                    { "postedBy._id": currentUserObjectId }
                ]
            });
        }
        const businessPrivateAccountConditions = [
            { "postedBy.businessProfileRef": { $exists: false } },
            { "postedBy.businessProfileRef": null },
            { "postedBy.businessProfileRef.privateAccount": { $ne: true } },
            { "postedBy.businessProfileRef.privateAccount": { $exists: false } }
        ];
        // Allow posts from private business accounts that are being followed
        // Note: Users follow the account owner (postedBy._id), not the business profile
        if (followedUserObjectIds.length > 0) {
            businessPrivateAccountConditions.push({
                $and: [
                    { "postedBy.businessProfileRef.privateAccount": true },
                    { "postedBy._id": { $in: followedUserObjectIds } }
                ]
            });
        }
        // Allow user's own business posts even if the business account is private
        if (currentUserObjectId) {
            businessPrivateAccountConditions.push({
                $and: [
                    { "postedBy.businessProfileRef.privateAccount": true },
                    { "postedBy._id": currentUserObjectId }
                ]
            });
        }
        pipeline.push({
            $match: {
                $and: [
                    { "postedBy": { $ne: null } },
                    {
                        $or: privateAccountConditions
                    },
                    {
                        $or: businessPrivateAccountConditions
                    }
                ]
            }
        });
    }
    else {
        // When skipping the filter, still ensure postedBy is not null
        pipeline.push({
            $match: {
                "postedBy": { $ne: null }
            }
        });
    }
    pipeline.push((0, anonymousUser_model_1.addAnonymousUserInPost)().lookup, (0, anonymousUser_model_1.addAnonymousUserInPost)().unwindLookup, (0, like_model_1.addLikesInPost)().lookup, (0, like_model_1.addLikesInPost)().addLikeCount, (0, comment_model_1.addCommentsInPost)().lookup, (0, comment_model_1.addCommentsInPost)().addCommentCount, (0, comment_model_1.addSharedCountInPost)().lookup, (0, comment_model_1.addSharedCountInPost)().addSharedCount, addReviewedBusinessProfileInPost().lookup, addReviewedBusinessProfileInPost().unwindLookup, addGoogleReviewedBusinessProfileInPost().lookup, addGoogleReviewedBusinessProfileInPost().unwindLookup, addInterestedPeopleInPost().lookup, addInterestedPeopleInPost().addInterestedCount, isLikedByMe(likedByMe), isSavedByMe(savedByMe), imJoining(joiningEvents), {
        $addFields: {
            reviewedBusinessProfileRef: {
                $cond: {
                    if: { $eq: [{ $ifNull: ["$reviewedBusinessProfileRef", null] }, null] }, // Check if field is null or doesn't exist
                    then: "$googleReviewedBusinessRef", // Replace with googleReviewedBusinessRef
                    else: "$reviewedBusinessProfileRef" // Keep the existing value if it exists
                }
            },
            postedBy: {
                $cond: {
                    if: { $eq: [{ $ifNull: ["$postedBy", null] }, null] }, // Check if field is null or doesn't exist
                    then: "$publicPostedBy", // Replace with publicPostedBy
                    else: "$postedBy" // Keep the existing value if it exists
                }
            }
        }
    }, {
        $unset: [
            "geoCoordinate",
            "distance",
            "sortDate",
            "publicPostedBy",
            "googleReviewedBusinessRef",
            "eventJoinsRef",
            "reviews",
            "isPublished",
            "sharedRef",
            "commentsRef",
            "likesRef",
            "tagged",
            "media",
            "updatedAt",
            "__v"
        ]
    });
    return Post.aggregate(pipeline).exec();
}
exports.fetchPosts = fetchPosts;
function countPostDocument(filter) {
    return Post.find(filter).countDocuments();
}
exports.countPostDocument = countPostDocument;
exports.getPostQuery = { isPublished: true, isDeleted: false };
function getPostsCount(userID) {
    return __awaiter(this, void 0, void 0, function* () {
        return Post.find(Object.assign(Object.assign({}, exports.getPostQuery), { $and: [
                { postType: { $in: [PostType.POST, PostType.EVENT] } },
                {
                    $or: [
                        { userID: userID }, // user's own posts
                        { collaborators: userID } // collaborated posts
                    ]
                }
            ] })).countDocuments();
    });
}
exports.getPostsCount = getPostsCount;
function getSavedPost(userID) {
    return __awaiter(this, void 0, void 0, function* () {
        return savedPost_model_1.default.distinct('postID', { userID: userID, postID: { $ne: null } });
    });
}
exports.getSavedPost = getSavedPost;
