import mongoose, { Schema, Types, Document, Model } from 'mongoose';
import { AccountType } from './user.model';
import { DevicePlatform } from '../../validation/common-validation';
import { MongoID } from '../../common';
export interface IDevicesConfig extends Document {
    deviceID: string;
    devicePlatform: DevicePlatform;
    notificationToken: string,//FCM token for firebase notification for users.
    userID: MongoID,
    accountType: AccountType | undefined;
}

const DevicesConfigSchema: Schema = new Schema<IDevicesConfig>(
    {
        deviceID: {
            type: String, required: true,
        },
        devicePlatform: {
            type: String, required: true, enum: DevicePlatform
        },
        notificationToken: {
            type: String, required: true
        },
        userID: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        accountType: {
            type: String, enum: AccountType
        }
    },
    {
        timestamps: true
    }
);
DevicesConfigSchema.set('toObject', { virtuals: true });
DevicesConfigSchema.set('toJSON', { virtuals: true });


export interface IDevicesConfigModel extends Model<IDevicesConfig> {
}

const DevicesConfig = mongoose.model<IDevicesConfig, IDevicesConfigModel>('DevicesConfig', DevicesConfigSchema);
export default DevicesConfig;

/*** This function store device config to handle notification and other staff */
export async function addUserDevicesConfig(deviceID: string, devicePlatform: DevicePlatform, notificationToken: string, userID: MongoID, accountType: AccountType | undefined): Promise<IDevicesConfig> {
    try {
        const devicesConfig = await DevicesConfig.findOne({ userID: userID, accountType: accountType, deviceID: deviceID, devicePlatform: devicePlatform });
        if (!devicesConfig) {
            const newDevicesConfig = new DevicesConfig();
            newDevicesConfig.userID = userID;
            newDevicesConfig.accountType = accountType;
            newDevicesConfig.notificationToken = notificationToken;
            newDevicesConfig.deviceID = deviceID;
            newDevicesConfig.devicePlatform = devicePlatform;
            const savedDevicesConfig = await newDevicesConfig.save();
            return savedDevicesConfig;
        } else {
            devicesConfig.userID = userID;
            devicesConfig.accountType = accountType;
            devicesConfig.notificationToken = notificationToken;
            devicesConfig.deviceID = deviceID;
            devicesConfig.devicePlatform = devicePlatform;
            const savedDevicesConfig = await devicesConfig.save();
            return savedDevicesConfig;
        }
    } catch (error) {
        throw error; // Reject the promise with the error
    }
}