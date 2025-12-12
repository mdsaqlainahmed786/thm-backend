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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addUserDevicesConfig = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const user_model_1 = require("./user.model");
const common_validation_1 = require("../../validation/common-validation");
const DevicesConfigSchema = new mongoose_1.Schema({
    deviceID: {
        type: String, required: true,
    },
    devicePlatform: {
        type: String, required: true, enum: common_validation_1.DevicePlatform
    },
    notificationToken: {
        type: String, required: true
    },
    userID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    accountType: {
        type: String, enum: user_model_1.AccountType
    }
}, {
    timestamps: true
});
DevicesConfigSchema.set('toObject', { virtuals: true });
DevicesConfigSchema.set('toJSON', { virtuals: true });
const DevicesConfig = mongoose_1.default.model('DevicesConfig', DevicesConfigSchema);
exports.default = DevicesConfig;
/*** This function store device config to handle notification and other staff */
function addUserDevicesConfig(deviceID, devicePlatform, notificationToken, userID, accountType) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const devicesConfig = yield DevicesConfig.findOne({ userID: userID, accountType: accountType, deviceID: deviceID, devicePlatform: devicePlatform });
            if (!devicesConfig) {
                const newDevicesConfig = new DevicesConfig();
                newDevicesConfig.userID = userID;
                newDevicesConfig.accountType = accountType;
                newDevicesConfig.notificationToken = notificationToken;
                newDevicesConfig.deviceID = deviceID;
                newDevicesConfig.devicePlatform = devicePlatform;
                const savedDevicesConfig = yield newDevicesConfig.save();
                return savedDevicesConfig;
            }
            else {
                devicesConfig.userID = userID;
                devicesConfig.accountType = accountType;
                devicesConfig.notificationToken = notificationToken;
                devicesConfig.deviceID = deviceID;
                devicesConfig.devicePlatform = devicePlatform;
                const savedDevicesConfig = yield devicesConfig.save();
                return savedDevicesConfig;
            }
        }
        catch (error) {
            throw error; // Reject the promise with the error
        }
    });
}
exports.addUserDevicesConfig = addUserDevicesConfig;
