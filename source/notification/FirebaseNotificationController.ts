import DevicesConfig, { IDevicesConfig } from "../database/models/appDeviceConfig.model";
import { FirebaseError } from 'firebase-admin';
import * as firebase from "firebase-admin";
import { Message } from "firebase-admin/lib/messaging/messaging-api";
import { DevicePlatform } from "../validation/common-validation";
import { AppConfig } from "../config/constants";
const serviceAccount: firebase.ServiceAccount = {
    projectId: AppConfig.FIREBASE.PROJECT_ID,
    clientEmail: AppConfig.FIREBASE.CLIENT_EMAIL,
    privateKey: AppConfig.FIREBASE.PRIVATE_KEY
}
firebase.initializeApp({ credential: firebase.credential.cert(serviceAccount) });

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
type NotificationData = {
    notificationID: string;
    devicePlatform?: DevicePlatform | undefined;
    type?: string | undefined;
    image?: string | undefined;
    profileImage?: string | undefined;
    route?: string | undefined; // Optional route/screen for navigation
}
export const createMessagePayload = (token: string, title: string, description: string, data: NotificationData) => {
    const { notificationID, devicePlatform, type, image, profileImage, route } = data;
    // Use route if provided, otherwise fall back to type for screen
    const screenValue = route ?? type ?? "";
    const message: Message = {
        token: token,
        data: {
            title: title,
            body: description,
            notificationID: notificationID,
            screen: screenValue,
            type: type ?? "", // Keep type for notification identification
            route: route ?? "", // Explicit route field for navigation
            image: image ?? "",
            profileImage: profileImage ?? ""
        },
    };
    if (devicePlatform && devicePlatform === DevicePlatform.ANDROID) {
        Object.assign(message, {
            android: {
                priority: 'high',
                data: {
                    title: title,
                    body: description,
                    notificationID: notificationID,
                    screen: screenValue,
                    type: type ?? "",
                    route: route ?? "",
                    image: image ?? "",
                    profileImage: profileImage ?? ""
                },
            },
        })
    }
    if (devicePlatform && devicePlatform === DevicePlatform.IOS) {
        Object.assign(message, {
            notification: {
                title: title,
                body: description
            },
            apns: {
                payload: {
                    aps: {
                        "alert": {
                            "title": title,
                            "body": description
                        },
                        "sound": "default",
                        "mutable-content": 1,
                        // "content-available": 1,
                    },
                    // Custom data for iOS to handle navigation
                    notificationID: notificationID,
                    screen: screenValue,
                    type: type ?? "",
                    route: route ?? "",
                    image: image ?? "",
                    profileImage: profileImage ?? ""
                }
            }
        })
    }
    return message;
}


export const sendNotification = async (message: Message) => {
    try {
        const data = await firebase.messaging().send(message);
        console.info("Notification sent");
    }
    catch (error: any) {
        if (error as FirebaseError) {
            if (
                error.errorInfo.code === "messaging/registration-token-not-registered" ||
                error.errorInfo.code === "messaging/invalid-argument"
            ) {
                const { token } = message as any;
                await DevicesConfig.deleteOne({ notificationToken: token }).catch((error) => console.error("Error  DevicesConfig.deleteOne"));
            }
            console.error(error)
        } else {
            // Handle other types of errors if needed
            console.error("Caught an unknown error:", error);
        }

    }
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