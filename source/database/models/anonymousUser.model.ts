
import { Schema, Document, model, Types } from "mongoose";
import { GeoCoordinate, IProfilePic, ProfileSchema } from "./common.model";
import { MongoID, Role } from "../../common";
import EmailNotificationService from "../../services/EmailNotificationService";
import { IAddress } from "./common.model";
import { AddressSchema } from "./common.model";
const emailNotificationService = new EmailNotificationService();
export enum SocialAccount {
    FACEBOOK = "facebook",
    GOOGLE = "google",
    APPLE = "apple",
}
export interface ISocialID {
    socialUId: string;
    socialType: string,
}
const SocialIDSchema = new Schema<ISocialID>({
    socialUId: { type: String },
    socialType: { type: String, enum: SocialAccount, required: true },

});

export enum AccountType {
    INDIVIDUAL = "individual",
    BUSINESS = "business"
}
export interface Individual {

}

export interface Business {
    username: string;
    email: string;
    phoneNumber: string;
    dialCode: string;
    accountType: AccountType;
    name: string;
    bio: string;
    profilePic: IProfilePic;
    acceptedTerms: boolean;//User  accepted the terms
    notificationEnabled: boolean;
    role: Role;
    lastSeen: Date;
    socialIDs: ISocialID[];
    profession: string;
    geoCoordinate: GeoCoordinate;
    coverImage: string;
    businessTypeID: MongoID;
    businessSubTypeID: MongoID;
    address: IAddress;
    website: string;
    gstn: string;
    description: string;
    amenities: MongoID[];
    placeID: string;
    rating: number;
}


export interface IUser extends Document, Individual, Business {
}


const UserSchema: Schema = new Schema<IUser>(
    {
        bio: { type: String, default: "" },
        profilePic: ProfileSchema,
        username: { type: String },
        businessTypeID: {
            type: Schema.Types.ObjectId,
            ref: "BusinessType"
        },
        businessSubTypeID: {
            type: Schema.Types.ObjectId,
            ref: "BusinessSubType"
        },
        name: { type: String, required: true },
        address: AddressSchema,
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
    },
    {
        timestamps: true
    }
);
UserSchema.index({ 'geoCoordinate': '2dsphere' });
UserSchema.set('toObject', { virtuals: true });
UserSchema.set('toJSON', { virtuals: true });

export interface IUserModel extends IUser {
    createdAt: Date;
    updatedAt: Date;
}

const AnonymousUser = model<IUserModel>('AnonymousUser', UserSchema);
export default AnonymousUser;



