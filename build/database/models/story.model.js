"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMediaInStory = exports.storyTimeStamp = void 0;
const mongoose_1 = require("mongoose");
const common_model_1 = require("./common.model");
const LikeSchema = new mongoose_1.Schema({
    userID: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    mediaID: { type: mongoose_1.Schema.Types.ObjectId, ref: "Media", required: true },
    businessProfileID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "BusinessProfile"
    },
    timeStamp: {
        type: Date,
        default: Date.now,
        expires: '24h' // automatically delete the story after 24 hours
    },
    duration: {
        type: Number,
        default: 0,
    },
    location: common_model_1.LocationSchema,
    userTagged: {
        type: String,
    },
    userTaggedId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
    locationPositionX: {
        type: Number,
    },
    locationPositionY: {
        type: Number,
    },
    userTaggedPositionX: {
        type: Number,
    },
    userTaggedPositionY: {
        type: Number,
    },
}, {
    timestamps: true
});
LikeSchema.set('toObject', { virtuals: true });
LikeSchema.set('toJSON', { virtuals: true });
const Story = (0, mongoose_1.model)('Story', LikeSchema);
exports.default = Story;
exports.storyTimeStamp = new Date(Date.now() - 24 * 60 * 60 * 1000);
function addMediaInStory() {
    const lookup = {
        '$lookup': {
            'from': 'media',
            'let': { 'mediaID': '$mediaID' },
            'pipeline': [
                { '$match': { '$expr': { '$eq': ['$_id', '$$mediaID'] } } },
                {
                    '$project': {
                        '_id': 0,
                        'sourceUrl': 1,
                        'thumbnailUrl': 1,
                        'mimeType': 1,
                        'duration': 1,
                    }
                }
            ],
            'as': 'mediaRef'
        }
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$mediaRef',
            'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
        }
    };
    const replaceRootAndMergeObjects = {
        '$replaceRoot': {
            'newRoot': {
                '$mergeObjects': ["$$ROOT", "$mediaRef"] // Merge mediaRef with the main object
            }
        }
    };
    const project = {
        $project: {
            '_id': 1,
            'mediaID': 1,
            'createdAt': 1,
            'mimeType': 1,
            'sourceUrl': 1,
            'likedByMe': 1,
            'duration': 1,
            'seenByMe': 1,
            'thumbnailUrl': 1,
            'location': 1,
            'userTagged': 1,
            'userTaggedId': 1,
            'locationPositionX': 1,
            'locationPositionY': 1,
            'userTaggedPositionX': 1,
            'userTaggedPositionY': 1,
        }
    };
    return { lookup, unwindLookup, replaceRootAndMergeObjects, project };
}
exports.addMediaInStory = addMediaInStory;
