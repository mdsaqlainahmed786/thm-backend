"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = exports.createMessagePayload = void 0;
exports.verifyDeviceConfig = verifyDeviceConfig;
exports.removeObsoleteFCMTokens = removeObsoleteFCMTokens;
const appDeviceConfig_model_1 = __importDefault(require("../database/models/appDeviceConfig.model"));
const firebase = __importStar(require("firebase-admin"));
const common_validation_1 = require("../validation/common-validation");
const constants_1 = require("../config/constants");
const serviceAccount = {
    projectId: constants_1.AppConfig.FIREBASE.PROJECT_ID,
    clientEmail: constants_1.AppConfig.FIREBASE.CLIENT_EMAIL,
    privateKey: constants_1.AppConfig.FIREBASE.PRIVATE_KEY
};
firebase.initializeApp({ credential: firebase.credential.cert(serviceAccount) });
function verifyDeviceConfig(fcmToken) {
    return __awaiter(this, void 0, void 0, function* () {
        const message = {
            data: {
                score: "850",
                time: "2:45",
            },
            token: fcmToken,
        };
        return firebase.messaging().send(message, true);
    });
}
const createMessagePayload = (token, title, description, data) => {
    const { notificationID, devicePlatform, type, image, profileImage } = data;
    const message = {
        token: token,
        data: {
            title: title,
            body: description,
            notificationID: notificationID,
            screen: type !== null && type !== void 0 ? type : "",
            image: image !== null && image !== void 0 ? image : "",
            profileImage: profileImage !== null && profileImage !== void 0 ? profileImage : ""
        },
    };
    if (devicePlatform && devicePlatform === common_validation_1.DevicePlatform.ANDROID) {
        Object.assign(message, {
            android: {
                priority: 'high',
                data: {
                    title: title,
                    body: description,
                    notificationID: notificationID,
                    screen: type,
                    image: image !== null && image !== void 0 ? image : "",
                    profileImage: profileImage !== null && profileImage !== void 0 ? profileImage : ""
                },
            },
        });
    }
    if (devicePlatform && devicePlatform === common_validation_1.DevicePlatform.IOS) {
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
                    }
                }
            }
        });
    }
    return message;
};
exports.createMessagePayload = createMessagePayload;
const sendNotification = (message) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield firebase.messaging().send(message);
        console.info("Notification sent");
    }
    catch (error) {
        if (error) {
            if (error.errorInfo.code === "messaging/registration-token-not-registered" ||
                error.errorInfo.code === "messaging/invalid-argument") {
                const { token } = message;
                yield appDeviceConfig_model_1.default.deleteOne({ notificationToken: token }).catch((error) => console.error("Error  DevicesConfig.deleteOne"));
            }
            console.error(error);
        }
        else {
            // Handle other types of errors if needed
            console.error("Caught an unknown error:", error);
        }
    }
});
exports.sendNotification = sendNotification;
/** Remove the mobile device notification token which is no longer produced or used.  */
function removeObsoleteFCMTokens() {
    return __awaiter(this, void 0, void 0, function* () {
        const allDevicesConfig = yield appDeviceConfig_model_1.default.find({});
        console.log(`\n\nRemoveObsoleteFCMTokens::: ${new Date()} \n\n`);
        yield Promise.all(allDevicesConfig.map((devicesConfig) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield verifyDeviceConfig(devicesConfig.notificationToken);
            }
            catch (error) {
                if (error) {
                    if (error.errorInfo.code === "messaging/registration-token-not-registered" ||
                        error.errorInfo.code === "messaging/invalid-argument") {
                        yield appDeviceConfig_model_1.default.findByIdAndDelete(devicesConfig._id).catch((error) => console.log(error));
                    }
                }
                else {
                    // Handle other types of errors if needed
                    console.error("Caught an unknown error:", error);
                }
            }
        })));
    });
}
