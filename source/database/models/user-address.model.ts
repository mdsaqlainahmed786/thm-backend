import mongoose, { Schema, Types, Document, Model } from 'mongoose';
import { Address, GeoCoordinate } from './common.model';

export interface IUserAddress extends Document, Address {
    geoCoordinate: GeoCoordinate;
    phoneNumber: String;
    dialCode: String;
    userID: Types.ObjectId;
}

const UserAddressSchema: Schema = new Schema<IUserAddress>(
    {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true },
        phoneNumber: {
            type: String, match: [/^\d{1,14}$/]
        },
        dialCode: {
            type: String, match: [/^\+\d{1,3}$/],
        },
        userID: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "User"
        },
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
    {
        timestamps: true
    }
);
export interface IUserAddressModel extends IUserAddress {
}
UserAddressSchema.set('toObject', { virtuals: true });
UserAddressSchema.set('toJSON', { virtuals: true });
UserAddressSchema.index({ 'geoCoordinate': '2dsphere' });
const UserAddress = mongoose.model<IUserAddressModel>('UserAddress', UserAddressSchema);

export default UserAddress;
