import { Schema, Document, model, Types } from "mongoose";
import { IProfilePic, ProfileSchema } from "./common.model";
import { MongoID } from "../../common";
import { Address, AddressSchema, IAddress } from "./common.model";

export interface IBusinessProfile extends Document {
    bio: string;
    profilePic: IProfilePic;
    coverImage: string;
    username: string;
    businessTypeID: MongoID;
    businessSubTypeID: MongoID;
    name: string;
    address: IAddress;
    email: string;
    phoneNumber: string;
    dialCode: string;
    website: string;
    gstn: string;
    description: string;
    amenities: MongoID[];
    placeID: string;
    privateAccount: boolean;
    rating: number;
}

const BusinessProfileSchema: Schema = new Schema<IBusinessProfile>(
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
        email: { type: String, lowercase: true, required: true, match: [/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, "email is invalid."], },
        // email: { type: String, lowercase: true, index: true, required: true, unique: true, match: [/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, "email is invalid."], },
        phoneNumber: { type: String },
        dialCode: { type: String },
        website: { type: String, default: '' },
        gstn: { type: String, default: '' },
        placeID: { type: String },
        amenities: [
            {
                type: Schema.Types.ObjectId,
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
    },
    {
        timestamps: true
    }
);
BusinessProfileSchema.set('toObject', { virtuals: true });
BusinessProfileSchema.set('toJSON', { virtuals: true });

// BusinessProfileSchema.plugin(uniqueValidator);
// Create the Geo spatial index on the coordinates field
BusinessProfileSchema.index({ 'address.geoCoordinate': '2dsphere' });

const BusinessProfile = model<IBusinessProfile>('BusinessProfile', BusinessProfileSchema);
export default BusinessProfile;


export async function fetchBusinessIDs(query?: string | undefined, businessTypeID?: string | undefined) {
    const dbQuery = {}
    if (query && query !== '') {
        Object.assign(dbQuery, {
            $or: [
                { name: { $regex: new RegExp(query.toLowerCase(), "i") } },
                { username: { $regex: new RegExp(query.toLowerCase(), "i") } },
            ]
        })
    }
    if (businessTypeID && businessTypeID !== '') {
        Object.assign(dbQuery, {
            businessTypeID: businessTypeID
        })
    }
    return await BusinessProfile.distinct('_id', dbQuery) as MongoID[];
}