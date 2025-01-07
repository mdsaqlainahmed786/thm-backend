import { Schema, Model, model, Types, Document } from 'mongoose';
import { MongoID, ContentType } from '../../common';
import { addBusinessProfileInUser } from './user.model';
interface IReport extends Document {
    reportedBy: MongoID;
    contentID: MongoID;
    contentType: ContentType;
    reason: string;
}

const ReportSchema: Schema = new Schema<IReport>(
    {
        reportedBy: { type: Schema.Types.ObjectId, Ref: "User", required: true },
        contentID: { type: Schema.Types.ObjectId, required: true },
        contentType: {
            type: String,
            enum: ContentType,
            default: ContentType.ANONYMOUS
        },
        reason: { type: String },
    },
    {
        timestamps: true
    });

export interface IReportModel extends IReport {
    createdAt: Date;
    updatedAt: Date;
}

const Report = model<IReportModel>("Report", ReportSchema);
export default Report;



export function addReportedByInReport() {
    const lookup = {
        '$lookup': {
            'from': 'users',
            'let': { 'userID': '$reportedBy', },
            'pipeline': [
                {
                    '$match': {
                        '$expr': { '$eq': ['$_id', '$$userID'] },
                    }
                },
                addBusinessProfileInUser().lookup,
                addBusinessProfileInUser().unwindLookup,
                projectBasicUserData(),
            ],
            'as': 'reportedByRef'
        }
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$reportedByRef',
            'preserveNullAndEmptyArrays': true
        }
    };
    return { lookup, unwindLookup }
}

export function projectBasicUserData() {
    return {
        $project: {
            "name": 1,
            "profilePic": 1,
            "accountType": 1,
            "businessProfileID": 1,
            "businessProfileRef._id": 1,
            "businessProfileRef.name": 1,
            "businessProfileRef.profilePic": 1,
        }
    }
}


export function addPostInReport() {
    const lookup = {
        '$lookup': {
            'from': 'posts',
            'let': { 'postID': '$contentID', 'contentType': '$contentType' },
            'pipeline': [
                {
                    '$match': {
                        '$expr': {
                            '$and': [
                                { '$eq': ['$_id', '$$postID'] },
                                { '$eq': ['$$contentType', ContentType.POST] }
                            ]
                        }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        content: 1,
                        postType: 1,
                    }
                }
            ],
            'as': 'postsRef'
        }
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$postsRef',
            'preserveNullAndEmptyArrays': true
        }
    };
    return { lookup, unwindLookup }
}

export function addCommentInReport() {
    const lookup = {
        '$lookup': {
            'from': 'comments',
            'let': { 'commentID': '$contentID', 'contentType': '$contentType' },
            'pipeline': [
                {
                    '$match': {
                        '$expr': {
                            '$and': [
                                { '$eq': ['$_id', '$$commentID'] },
                                { '$eq': ['$$contentType', ContentType.COMMENT] }
                            ]
                        }
                    }
                },
                {
                    '$lookup': {
                        'from': 'posts',
                        'let': { 'postID': '$postID', },
                        'pipeline': [
                            {
                                '$match': {
                                    '$expr': { '$eq': ['$_id', '$$postID'] },
                                }
                            },
                        ],
                        'as': 'postsRef'
                    }
                },
                {
                    '$unwind': {
                        'path': '$postsRef',
                        'preserveNullAndEmptyArrays': true
                    }
                },
                {
                    $project: {
                        _id: 1,
                        postType: {
                            '$ifNull': [{ '$ifNull': ['$postsRef.postType', ''] }, '']
                        },
                        postID: 1,
                        message: 1,
                        userID: 1,
                        posts: 1,
                    }
                }
            ],
            'as': 'commentsRef'
        }
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$commentsRef',
            'preserveNullAndEmptyArrays': true
        }
    };
    return { lookup, unwindLookup }
}


export function addUserInReport() {
    const lookup = {
        '$lookup': {
            'from': 'users',
            'let': { 'userID': '$contentID', 'contentType': '$contentType' },
            'pipeline': [
                {
                    '$match': {
                        '$expr': {
                            '$and': [
                                { '$eq': ['$_id', '$$userID'] },
                                { '$eq': ['$$contentType', ContentType.USER] }
                            ]
                        }
                    }
                },
                addBusinessProfileInUser().lookup,
                addBusinessProfileInUser().unwindLookup,
                projectBasicUserData(),
            ],
            'as': 'usersRef'
        }
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$usersRef',
            'preserveNullAndEmptyArrays': true
        }
    };
    return { lookup, unwindLookup }
}