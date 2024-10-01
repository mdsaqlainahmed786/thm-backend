import { Schema, Model, model, Types, Document } from 'mongoose';
import { MongoID } from '../../common';

export enum ConnectionStatus {
    PENDING = "pending",
    ACCEPTED = "accepted"
}

export interface IUserConnection extends Document {
    follower: MongoID;//represents the user who is initiating the action
    following: MongoID; //represents the user who is the subject of that action.
    status: string;
}
const UserConnectionSchema: Schema = new Schema<IUserConnection>(
    {
        follower: { type: Schema.Types.ObjectId, ref: "User", required: true },
        following: { type: Schema.Types.ObjectId, ref: "User", required: true },
        status: {
            type: String,
            enum: ConnectionStatus,
            default: ConnectionStatus.PENDING,
        },
    },
    {
        timestamps: true
    }
);
UserConnectionSchema.set('toObject', { virtuals: true });
UserConnectionSchema.set('toJSON', { virtuals: true });

export interface IUserConnectionModel extends Model<IUserConnection> {
}

const UserConnection = model<IUserConnection, IUserConnectionModel>("UserConnection", UserConnectionSchema);
export default UserConnection;


// export function addUserDataInUserConnection() {
//     const lookup = {
//         '$lookup': {
//             'from': 'userprofiles',
//             'let': { 'userID': '$userID' },
//             'pipeline': [
//                 { '$match': { '$expr': { '$eq': ['$userID', '$$userID'] } } },
//                 addCoverAndProfileInUserProfile().lookup,
//                 addCoverAndProfileInUserProfile().add_profile_and_cover_image,
//                 {
//                     $addFields: {
//                         fullName: { "$cond": [{ "$gt": ["$personalInfo.fullName", null] }, "$personalInfo.fullName", ""] },
//                         birthday: { "$cond": [{ "$gt": ["$personalInfo.birthday", null] }, "$personalInfo.birthday", ""] },
//                         location: {
//                             $cond: {
//                                 if: { $gt: ['$location.placeName', null] },
//                                 then: "$location",
//                                 else: null
//                             }
//                         },
//                     }
//                 },
//                 {
//                     $project: {
//                         _id: 0,
//                         userRef: 0,
//                         userID: 0,
//                         personalInfo: 0,
//                         interests: 0,
//                         images: 0,
//                         imageRef: 0,
//                         privacySettings: 0,
//                         createdAt: 0,
//                         updatedAt: 0,
//                         userMediaRef: 0,
//                         __v: 0,
//                     }
//                 }

//             ],
//             'as': 'userProfileRef'
//         }
//     };
//     const unwind_data = {
//         '$unwind': {
//             'path': '$userProfileRef',
//             'preserveNullAndEmptyArrays': false
//         }
//     };

//     const addAndMergedObject = {
//         $addFields: {
//             userProfileRef: { $ifNull: ["$userProfileRef", {}] }, // Ensure userProfileRef is an object
//             mergedObject: {
//                 $mergeObjects: ["$$ROOT", "$userProfileRef"]
//             }
//         }
//     };
//     const replaceRootWithMergedObject = {
//         $replaceRoot: { newRoot: "$mergedObject" }
//     }
//     return { lookup, unwind_data, addAndMergedObject, replaceRootWithMergedObject }
// }


// export function userConnectionDBQuery(userID: string | Types.ObjectId) {
//     return {
//         $or: [
//             { isRejected: false, isConnected: true, targetUserID: userID, },
//             { isRejected: false, isConnected: true, userID: userID, }
//         ]
//     };
// }
// export function userConnectionRequestDBQuery(userID: string | Types.ObjectId) {
//     return {
//         $or: [
//             { isRejected: false, isConnected: false, targetUserID: userID, },
//             { isRejected: false, isConnected: false, userID: userID, }
//         ]
//     };
// }