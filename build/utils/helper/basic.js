"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.predictCategory = exports.getDefaultProfilePic = exports.randomColor = exports.truncate = exports.countWords = exports.addStringBeforeExtension = exports.getAllKeysFromSchema = exports.parseQueryParam = exports.parseFloatToFixed = exports.getRandomInteger = exports.generateRandomAlphaNumericID = exports.findCommonStrings = exports.isObjectIdInArray = exports.isString = exports.isArray = exports.isNumeric = exports.generateOTP = exports.enumKeys = void 0;
const crypto_1 = __importDefault(require("crypto"));
const constants_1 = require("../../config/constants");
const BusinessTypeSeeder_1 = require("../../database/seeders/BusinessTypeSeeder");
/**
 * Custom string prototype to capitalize string
 */
String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
};
function enumKeys(obj) {
    return Object.keys(obj).filter(k => !Number.isNaN(k));
}
exports.enumKeys = enumKeys;
// import moment from 'moment';
function generateOTP() {
    const otp = Math.floor(10000 + Math.random() * 90000);
    return (constants_1.AppConfig.APP_ENV === "dev") ? 12345 : otp;
}
exports.generateOTP = generateOTP;
function isNumeric(data) {
    return isNaN(data);
}
exports.isNumeric = isNumeric;
function isArray(data) {
    return Array.isArray(data);
}
exports.isArray = isArray;
function isString(data) {
    if (typeof data === 'string' || data instanceof String) {
        return true;
    }
    else {
        return false;
    }
}
exports.isString = isString;
//check if a MongoDB ObjectId is in an array
function isObjectIdInArray(objectId, array) {
    const objectIdStr = objectId.toString(); // Convert the input ObjectId to string
    for (const item of array) {
        const itemStr = item.toString(); // Convert each item in the array to string
        if (objectIdStr === itemStr) {
            return true; // ObjectId found in the array
        }
    }
    return false; // ObjectId not found in the array
}
exports.isObjectIdInArray = isObjectIdInArray;
function findCommonStrings(arr1, arr2) {
    console.log(arr1, 'Array 1');
    console.log(arr2, 'Array 2');
    // Convert arrays to sets
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
    // Find the intersection (common strings) of the two sets
    const commonStrings = [];
    for (const item of set1) {
        if (set2.has(item)) {
            commonStrings.push(item);
        }
    }
    return commonStrings;
}
exports.findCommonStrings = findCommonStrings;
//Function generate a alpha number random id to given length....
function generateRandomAlphaNumericID(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randomBytes = crypto_1.default.randomBytes(length);
    const characterArray = Array.from(randomBytes, byte => characters[byte % characters.length]);
    return characterArray.join('');
}
exports.generateRandomAlphaNumericID = generateRandomAlphaNumericID;
//Function generate random integer between', minValue, 'and', maxValue.
function getRandomInteger(min, max, includeNegative) {
    if (includeNegative && includeNegative) {
        const randomSign = Math.random() < 0.5 ? -1 : 1; // Randomly choose between -1 (negative) and 1 (positive)
        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        return randomNumber * randomSign;
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
exports.getRandomInteger = getRandomInteger;
function parseFloatToFixed(number, precision) {
    let returnNumber;
    switch (precision) {
        case 2:
            returnNumber = Math.round(parseFloat(number) * 100) / 100;
            break;
        default:
            //return with only one point
            returnNumber = Math.round(parseFloat(number) * 10) / 10;
    }
    return returnNumber;
}
exports.parseFloatToFixed = parseFloatToFixed;
/** Function to parseQuery Params and set default value if not set */
function parseQueryParam(value, defaultValue) {
    if (value !== undefined && value !== '' && !isNaN(value)) {
        return parseInt(value);
    }
    return defaultValue;
}
exports.parseQueryParam = parseQueryParam;
// export const calculateTotalDays = (startDate: Date, endDate: Date): number => {
//     const startMoment = moment(startDate);
//     const endMoment = moment(endDate);
//     // Calculate the total difference in days
//     const totalDaysDifference = endMoment.diff(startMoment, 'days');
//     return totalDaysDifference + 1;
// };
/**
 * Function to get all keys from a schema, including nested ones
 * @param schema
 * @param prefix
 * @returns
 */
function getAllKeysFromSchema(schema, prefix = '') {
    let keys = [];
    for (const key in schema.paths) {
        const path = prefix ? `${prefix}.${key}` : key;
        keys.push(path);
        if (schema.paths[key].schema) {
            // Recursively get keys for nested schema
            //@ts-ignore
            keys = keys.concat(getAllKeysFromSchema(schema.paths[key].schema, path));
        }
    }
    return keys;
}
exports.getAllKeysFromSchema = getAllKeysFromSchema;
function addStringBeforeExtension(filePath, stringToAdd) {
    const lastDotIndex = filePath.lastIndexOf('.');
    if (lastDotIndex !== -1) {
        const nameWithoutExtension = filePath.slice(0, lastDotIndex);
        const extension = filePath.slice(lastDotIndex);
        // Concatenate the name, stringToAdd, and extension
        const newFilename = `${nameWithoutExtension}${stringToAdd}${extension}`;
        return newFilename;
    }
    else {
        // If there is no file extension, simply concatenate the stringToAdd at the end
        return `${filePath}`;
    }
}
exports.addStringBeforeExtension = addStringBeforeExtension;
//Return the word count of give string;
function countWords(string) {
    const trimmedStr = string.trim();
    if (trimmedStr === "") {
        return 0; // Return 0 if there are no words
    }
    const wordsArray = trimmedStr.split(/\s+/);
    return wordsArray.length; // Return the count of words
}
exports.countWords = countWords;
const months = ["January", "February", "March", "April", "May", "June", "July"];
const random = Math.floor(Math.random() * months.length);
function truncate(string, length) {
    const messageLength = length !== null && length !== void 0 ? length : 150;
    let truncatedComment = string ? string : '';
    return truncatedComment = truncatedComment.length > messageLength ? truncatedComment.slice(0, messageLength) + '...' : truncatedComment;
}
exports.truncate = truncate;
function randomColor() {
    const colors = ["#4285F4", "#0F9D58", "#DB4437", "#F4B400", "#9C27B0"];
    return colors[Math.floor(Math.random() * colors.length)];
}
exports.randomColor = randomColor;
function getDefaultProfilePic(request, size) {
    return request.protocol + "://" + request.get("host") + `/api/v1/profile-picture/thumbnail?color=${randomColor().replace("#", "")}&size=${size}`;
}
exports.getDefaultProfilePic = getDefaultProfilePic;
function predictCategory(types, name) {
    const Restaurant = ['cafe', 'bakery', 'food', 'restaurant', 'meal_delivery', 'meal_takeaway'];
    const Hotel = ['lodging'];
    const BarClubs = ['bar', 'night_club'];
    const HomeStays = ['lodging'];
    const MarriageBanquets = ['point_of_interest', 'establishment'];
    const isHotel = ['hotel'].some((word) => name.toLowerCase().includes(word));
    const isRestaurant = ['cafe', 'coffee', 'tea', 'restaurant', 'kitchen'].some((word) => name.toLowerCase().includes(word));
    const isBar = ['bar'].some((word) => name.toLowerCase().includes(word));
    const isMarriageBanquets = ['palace', 'resort', 'wedding', 'weddings', 'matrimonial'].some((word) => name.toLowerCase().includes(word));
    const isHomeStays = ['home stay', 'home', 'stay'].some((word) => name.toLowerCase().includes(word));
    console.log("isHotel", isHotel);
    console.log("isRestaurant", isRestaurant);
    console.log("isBar", isBar);
    console.log("isMarriageBanquets", isMarriageBanquets);
    console.log("isHomeStays", isHomeStays);
    console.log("types", types);
    //Bars / Clubs
    if (types.find((element) => BarClubs.includes(element)) && isBar) {
        console.log('isBar 1', name, types);
        return BusinessTypeSeeder_1.BusinessType.BARS_CLUBS;
    }
    else if (types.find((element) => BarClubs.includes(element)) || isBar) {
        console.log('isBar 2', name, types);
        return BusinessTypeSeeder_1.BusinessType.BARS_CLUBS;
    }
    //Hotel
    if (types.find((element) => Hotel.includes(element)) && isHotel) {
        console.log('isHotel 1', name, types);
        return BusinessTypeSeeder_1.BusinessType.HOTEL;
    }
    else if (types.find((element) => Hotel.includes(element)) || isHotel) {
        console.log('isHotel 2', name, types);
        return BusinessTypeSeeder_1.BusinessType.HOTEL;
    }
    //Restaurant
    if (types.filter((element) => Restaurant.includes(element)).length > 0 && isRestaurant) {
        console.log('isRestaurant 1', name, types);
        return BusinessTypeSeeder_1.BusinessType.RESTAURANT;
    }
    else if (types.filter((element) => Restaurant.includes(element)).length > 0 || isRestaurant) {
        console.log('isRestaurant 2', name, types);
        return BusinessTypeSeeder_1.BusinessType.RESTAURANT;
    }
    //
    //Home Stays
    if (types.filter((element) => HomeStays.includes(element)).length > 0 && isHomeStays) {
        console.log('isHomeStays 1', name, types);
        return BusinessTypeSeeder_1.BusinessType.HOME_STAYS;
    }
    else if (types.filter((element) => HomeStays.includes(element)).length > 0 || isHomeStays) {
        console.log('isHomeStays 2', name, types);
        return BusinessTypeSeeder_1.BusinessType.HOME_STAYS;
    }
    //Marriage Banquets
    if (types.filter((element) => MarriageBanquets.includes(element)).length > 0 && isMarriageBanquets) {
        console.log('isMarriageBanquets 1', name, types);
        return BusinessTypeSeeder_1.BusinessType.MARRIAGE_BANQUETS;
    }
    else if (types.filter((element) => MarriageBanquets.includes(element)).length > 0 || isMarriageBanquets) {
        console.log('isMarriageBanquets 2', name, types);
        return BusinessTypeSeeder_1.BusinessType.MARRIAGE_BANQUETS;
    }
}
exports.predictCategory = predictCategory;
