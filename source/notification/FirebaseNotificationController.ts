import DevicesConfig, { IDevicesConfig } from "../database/models/appDeviceConfig.model";
import { FirebaseError } from 'firebase-admin';
import * as firebase from "firebase-admin";
import { Message } from "firebase-admin/lib/messaging/messaging-api";
export async function verifyDeviceConfig(fcmToken: string): Promise<string> {
    const message: Message = {
        data: {
            score: "850",
            time: "2:45",
        },
        token: fcmToken,
    };
    return firebase.messaging().send(message, true);
}

/** Remove the mobile device notification token which is no longer produced or used.  */
export async function removeObsoleteFCMTokens() {
    const allDevicesConfig = await DevicesConfig.find({});
    console.log(`\n\nRemoveObsoleteFCMTokens::: ${new Date()} \n\n`)
    await Promise.all(allDevicesConfig.map(async (devicesConfig: IDevicesConfig) => {
        try {
            await verifyDeviceConfig(devicesConfig.notificationToken);
        } catch (error: any) {
            if (error as FirebaseError) {
                if (
                    error.errorInfo.code === "messaging/registration-token-not-registered" ||
                    error.errorInfo.code === "messaging/invalid-argument"
                ) {
                    await DevicesConfig.findByIdAndDelete(devicesConfig._id).catch((error: any) => console.log(error));
                }
            } else {
                // Handle other types of errors if needed
                console.error("Caught an unknown error:", error);
            }
        }
    }));
}