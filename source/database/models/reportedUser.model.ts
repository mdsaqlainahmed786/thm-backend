import { Schema, Model, model, Types, Document } from 'mongoose';
import { MongoID, ContentType } from '../../common';
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

export interface IReportModel extends Model<IReport> {
}

const Report = model<IReport, IReportModel>("Report", ReportSchema);
export default Report;


//FIXME return required user data
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
                }
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

//FIXME return required user data
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
                }
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