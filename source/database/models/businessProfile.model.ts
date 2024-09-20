import { Schema, Document, model, Types } from "mongoose";
import { IProfilePic, ProfileSchema } from "./user.model";

export interface GeoCoordinate {
    type: string,
    coordinates: Array<number>
}
export interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    lat?: Number;
    lng?: Number;
}

export interface IAddress extends Address {
    geoCoordinate?: GeoCoordinate,
}


export interface IBusinessProfile extends Document {
    bio: string;
    profilePic: IProfilePic;
    username: string;
    businessTypeID: Types.ObjectId | string;
    businessSubTypeID: Types.ObjectId | string;
    name: string;
    address: IAddress;
    email: string;
    phoneNumber: string;
    dialCode: string;
    website: string;
    gstn: string;
    description: string;
    amenities: (Types.ObjectId | string)[];
}
const AddressSchema = new Schema<IAddress>(
    {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true },
        geoCoordinate: {
            type: {
                type: String,
                enum: ['Point'],  // Specify the type as "Point" for geo spatial indexing
            },
            coordinates: {
                type: [Number],
            }
        },
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },

    },
    { _id: false }
);
const BusinessProfileSchema: Schema = new Schema<IBusinessProfile>(
    {
        bio: { type: String, default: "" },
        profilePic: ProfileSchema,
        description: { type: String },//FIXME bio or description
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
        amenities: [
            {
                type: Schema.Types.ObjectId,
                ref: "BusinessQuestion"
            }
        ],
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
