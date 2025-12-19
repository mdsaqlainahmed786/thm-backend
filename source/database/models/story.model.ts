import { Document, Model, Schema, model, Types } from "mongoose";
import { MongoID } from "../../common";
import { LocationSchema, ILocation } from "./common.model";

interface IStory extends Document {
    userID: MongoID;
    businessProfileID?: MongoID;
    mediaID: MongoID;
    timeStamp: Date;
    duration: number;
    location?: ILocation;
    userTagged?: string;
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
        userTagged: {
            type: String,
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
            'likedByMe': 1,
            'duration': 1,
            'seenByMe': 1,
            'thumbnailUrl': 1,
            'location': 1,
            'userTagged': 1,
        }
    }
    return { lookup, unwindLookup, replaceRootAndMergeObjects, project }
}

