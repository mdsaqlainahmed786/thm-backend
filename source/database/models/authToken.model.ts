import { Schema, Model, model, Types, Document } from 'mongoose';
import { AccountType } from './user.model';
import { MongoID } from '../../common';
interface IAuthToken extends Document {
    userID: MongoID;
    accountType: AccountType | undefined;
    refreshToken: string;
    creationDate: Date;
    deviceID?: string;
}

const AuthTokenSchema: Schema = new Schema<IAuthToken>(
    {
        userID: { type: Schema.Types.ObjectId },
        accountType: { type: String, enum: AccountType },
        refreshToken: { type: String, },
        creationDate: { type: Date },
        deviceID: { type: String }
    },
    {
        timestamps: true
    });

export interface IAuthTokenModel extends Model<IAuthToken> {
}

const AuthToken = model<IAuthToken, IAuthTokenModel>("AuthToken", AuthTokenSchema);
export default AuthToken;