import { Document, Model, Schema, model, Types } from "mongoose";
import { MongoID } from "../../common";
import { LocationSchema, ILocation } from "./common.model";
import { addBusinessProfileInUser } from "./user.model";

export interface ITaggedUser {
    userTagged: string;
    userTaggedId: MongoID;
    positionX: number;
    positionY: number;
}

const TaggedUserSchema = new Schema<ITaggedUser>(
    {
        userTagged: {
            type: String,
            required: true
        },
        userTaggedId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        positionX: {
            type: Number,
            required: true
        },
        positionY: {
            type: Number,
            required: true
        }
    },
    {
        _id: false
    }
);

interface IStory extends Document {
    userID: MongoID;
    businessProfileID?: MongoID;
    mediaID: MongoID;
    timeStamp: Date;
    duration: number;
    location?: ILocation;
    taggedUsers?: ITaggedUser[];
    locationPositionX?: number;
    locationPositionY?: number;
    // Keep old fields for backward compatibility during migration
    userTagged?: string;
    userTaggedId?: MongoID;
    userTaggedPositionX?: number;
    userTaggedPositionY?: number;
}
const LikeSchema: Schema = new Schema<IStory>(
    {
        userID: { type: Schema.Types.ObjectId, ref: "User", required: true },
        mediaID: { type: Schema.Types.ObjectId, ref: "Media", required: true },
        businessProfileID: {
            type: Schema.Types.ObjectId,
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
        location: LocationSchema,
        taggedUsers: [TaggedUserSchema],
        locationPositionX: {
            type: Number,
        },
        locationPositionY: {
            type: Number,
        },
        // Keep old fields for backward compatibility during migration
        userTagged: {
            type: String,
        },
        userTaggedId: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        userTaggedPositionX: {
            type: Number,
        },
        userTaggedPositionY: {
            type: Number,
        },
    },
    {
        timestamps: true
    }
);
LikeSchema.set('toObject', { virtuals: true });
LikeSchema.set('toJSON', { virtuals: true });

export interface IStoryModel extends Model<IStory> {
}

const Story = model<IStory, IStoryModel>('Story', LikeSchema);
export default Story;


export const storyTimeStamp = new Date(Date.now() - 24 * 60 * 60 * 1000);


export function addMediaInStory() {
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
                        'mediaType': 1,
                        'videoUrl': 1,
                    }
                }
            ],
            'as': 'mediaRef'
        }
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$mediaRef',
            'preserveNullAndEmptyArrays': true//false value does not fetch relationship.
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
            'videoUrl': 1,
            'mediaType': 1,
            'likedByMe': 1,
            'duration': 1,
            'seenByMe': 1,
            'thumbnailUrl': 1,
            'location': 1,
            'taggedUsers': 1,
            'locationPositionX': 1,
            'locationPositionY': 1,
            // Keep old fields for backward compatibility
            'userTagged': 1,
            'userTaggedId': 1,
            'userTaggedPositionX': 1,
            'userTaggedPositionY': 1,
        }
    }
    return { lookup, unwindLookup, replaceRootAndMergeObjects, project }
}

/**
 * 
 * @returns 
 * Return tagged users reference in story with populated user details
 * Uses unwind -> lookup -> group pattern to populate user details for each tagged user
 */
export function addTaggedUsersInStory() {
    // Save all fields before unwinding
    const addFieldsBeforeUnwind = {
        $addFields: {
            _root: {
                $arrayToObject: {
                    $filter: {
                        input: { $objectToArray: "$$ROOT" },
                        cond: { $ne: ["$$this.k", "taggedUsers"] }
                    }
                }
            },
            _taggedUsersArray: "$taggedUsers"
        }
    };

    const unwind = {
        $unwind: {
            path: "$_taggedUsersArray",
            preserveNullAndEmptyArrays: true
        }
    };

    const lookup = {
        $lookup: {
            from: "users",
            let: { userId: "$_taggedUsersArray.userTaggedId" },
            pipeline: [
                { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
                addBusinessProfileInUser().lookup,
                addBusinessProfileInUser().unwindLookup,
                {
                    $project: {
                        "_id": 1,
                        "name": 1,
                        "username": 1,
                        "profilePic": 1,
                        "accountType": 1,
                        "businessProfileID": 1,
                        "businessProfileRef._id": 1,
                        "businessProfileRef.name": 1,
                        "businessProfileRef.username": 1,
                        "businessProfileRef.profilePic": 1,
                    }
                }
            ],
            as: "taggedUserDetails"
        }
    };

    const addFields = {
        $addFields: {
            "_taggedUsersArray.user": {
                $cond: {
                    if: { $gt: [{ $size: "$taggedUserDetails" }, 0] },
                    then: { $arrayElemAt: ["$taggedUserDetails", 0] },
                    else: null
                }
            }
        }
    };

    const group = {
        $group: {
            _id: "$_id",
            root: { $first: "$_root" },
            taggedUsers: {
                $push: {
                    $cond: {
                        if: { $ne: ["$_taggedUsersArray", null] },
                        then: "$_taggedUsersArray",
                        else: "$$REMOVE"
                    }
                }
            }
        }
    };

    const replaceRoot = {
        $replaceRoot: {
            newRoot: {
                $mergeObjects: [
                    "$root",
                    {
                        taggedUsers: {
                            $cond: {
                                if: { $eq: [{ $size: "$taggedUsers" }, 0] },
                                then: [],
                                else: "$taggedUsers"
                            }
                        }
                    }
                ]
            }
        }
    };

    return { addFieldsBeforeUnwind, unwind, lookup, addFields, group, replaceRoot }
}

