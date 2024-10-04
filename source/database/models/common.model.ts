import { Schema, Document, model, Types } from "mongoose";

export interface IProfilePic {
    small: string;
    medium: string;
    large: string;
}

export const ProfileSchema: Schema = new Schema<IProfilePic>(
    {
        small: {
            type: String,
            default: ""
        },
        medium: {
            type: String,
            default: ""
        },
        large: {
            type: String,
            default: "",
        }
    },
    {
        _id: false,
    }
);


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

export const AddressSchema = new Schema<IAddress>(
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


export interface ILocation {
    lat: number,
    lng: number,
    placeName: string,
}

export const LocationSchema = new Schema<ILocation>(
    {
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 },
        placeName: { type: String, default: "" },
    },
    {
        _id: false,
    }
)