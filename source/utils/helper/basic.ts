import { Types, Schema } from "mongoose";
import crypto from 'crypto';
import { AppConfig } from "../../config/constants";
import { MongoID } from "../../common";
import { Request } from "express";
import { BusinessType } from "../../database/seeders/BusinessTypeSeeder";
declare global {
    interface String {
        capitalize(): string;
    }
}

/**
 * Custom string prototype to capitalize string
 */
String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
};
export function enumKeys<O extends object, K extends keyof O = keyof O>(obj: O): K[] {
    return Object.keys(obj).filter(k => !Number.isNaN(k)) as K[]
}

// import moment from 'moment';
export function generateOTP() {
    const otp: number = Math.floor(10000 + Math.random() * 90000);
    return (AppConfig.APP_ENV === "dev") ? 12345 : otp;
}

export function isNumeric(data: any) {
    return isNaN(data);
}

export function isArray(data: any): boolean {

    return Array.isArray(data);
}
export function isString(data: any): boolean {
    if (typeof data === 'string' || data instanceof String) {
        return true;
    } else {
        return false;
    }
}

//check if a MongoDB ObjectId is in an array
export function isObjectIdInArray(objectId: MongoID, array: any[]): boolean {
    const objectIdStr = objectId.toString(); // Convert the input ObjectId to string
    for (const item of array) {
        const itemStr = item.toString(); // Convert each item in the array to string
        if (objectIdStr === itemStr) {
            return true; // ObjectId found in the array
        }
    }
    return false; // ObjectId not found in the array
}


export function findCommonStrings(arr1: string[], arr2: string[]): string[] {
    console.log(arr1, 'Array 1');
    console.log(arr2, 'Array 2');
    // Convert arrays to sets
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
    // Find the intersection (common strings) of the two sets
    const commonStrings: string[] = [];
    for (const item of set1) {
        if (set2.has(item)) {
            commonStrings.push(item);
        }
    }
    return commonStrings;
}


//Function generate a alpha number random id to given length....
export function generateRandomAlphaNumericID(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randomBytes = crypto.randomBytes(length);
    const characterArray = Array.from(randomBytes, byte => characters[byte % characters.length]);
    return characterArray.join('');
}
//Function generate random integer between', minValue, 'and', maxValue.
export function getRandomInteger(min: number, max: number, includeNegative?: boolean): number {
    if (includeNegative && includeNegative) {
        const randomSign = Math.random() < 0.5 ? -1 : 1; // Randomly choose between -1 (negative) and 1 (positive)
        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        return randomNumber * randomSign;
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;

}




export function parseFloatToFixed(number: any, precision?: number): number {
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

/** Function to parseQuery Params and set default value if not set */
export function parseQueryParam(value: any, defaultValue: number): number {
    if (value !== undefined && value !== '' && !isNaN(value)) {
        return parseInt(value);
    }
    return defaultValue;
}
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
export function getAllKeysFromSchema(schema: Schema, prefix: string = ''): string[] {
    let keys: string[] = [];
    for (const key in schema.paths) {
        const path = prefix ? `${prefix}.${key}` : key;
        keys.push(path);
        if (schema.paths[key].schema) {
            // Recursively get keys for nested schema
            keys = keys.concat(getAllKeysFromSchema(schema.paths[key].schema, path));
        }
    }

    return keys;
}


export function addStringBeforeExtension(filePath: string, stringToAdd: string) {
    const lastDotIndex = filePath.lastIndexOf('.');
    if (lastDotIndex !== -1) {
        const nameWithoutExtension = filePath.slice(0, lastDotIndex);
        const extension = filePath.slice(lastDotIndex);
        // Concatenate the name, stringToAdd, and extension
        const newFilename = `${nameWithoutExtension}${stringToAdd}${extension}`;
        return newFilename;
    } else {
        // If there is no file extension, simply concatenate the stringToAdd at the end
        return `${filePath}`;
    }
}


//Return the word count of give string;
export function countWords(string: string) {
    const trimmedStr = string.trim();
    if (trimmedStr === "") {
        return 0; // Return 0 if there are no words
    }
    const wordsArray = trimmedStr.split(/\s+/);
    return wordsArray.length; // Return the count of words
}

const months = ["January", "February", "March", "April", "May", "June", "July"];

const random = Math.floor(Math.random() * months.length);

export function truncate(string: string, length?: number) {
    const messageLength = length ?? 150;
    let truncatedComment = string ? string : '';
    return truncatedComment = truncatedComment.length > messageLength ? truncatedComment.slice(0, messageLength) + '...' : truncatedComment
}
export function randomColor() {
    const colors = ["#4285F4", "#0F9D58", "#DB4437", "#F4B400", "#9C27B0"];
    return colors[Math.floor(Math.random() * colors.length)];
}


export function getDefaultProfilePic(request: Request, letter: string, size: string) {
    return request.protocol + "://" + request.get("host") + `/api/v1/profile-picture/thumbnail?color=${randomColor().replace("#", "")}&letter=${letter}&size=${size}`;
}


export function predictCategory(types: string[], name: string) {
    const Restaurant = ['cafe', 'bakery', 'food', 'restaurant', 'meal_delivery', 'meal_takeaway'];
    const Hotel = ['lodging'];
    const BarClubs = ['bar', 'night_club'];
    const HomeStays = ['lodging'];
    const MarriageBanquets = ['point_of_interest', 'establishment'];

    const isHotel = ['hotel'].some((word: string) => name.toLowerCase().includes(word));
    const isRestaurant = ['cafe', 'coffee', 'tea', 'restaurant', 'kitchen'].some((word: string) => name.toLowerCase().includes(word));
    const isBar = ['bar'].some((word: string) => name.toLowerCase().includes(word));
    const isMarriageBanquets = ['palace', 'resort', 'wedding', 'weddings', 'matrimonial'].some((word: string) => name.toLowerCase().includes(word));
    const isHomeStays = ['home stay', 'home', 'stay'].some((word: string) => name.toLowerCase().includes(word));
    console.log("isHotel", isHotel);
    console.log("isRestaurant", isRestaurant);
    console.log("isBar", isBar);
    console.log("isMarriageBanquets", isMarriageBanquets);
    console.log("isHomeStays", isHomeStays);
    console.log("types", types)

    //Bars / Clubs
    if (types.find((element: any) => BarClubs.includes(element)) && isBar) {
        console.log('isBar 1', name, types)
        return BusinessType.BARS_CLUBS;
    } else if (types.find((element: any) => BarClubs.includes(element)) || isBar) {
        console.log('isBar 2', name, types)
        return BusinessType.BARS_CLUBS;
    }
    //Hotel
    if (types.find((element: any) => Hotel.includes(element)) && isHotel) {
        console.log('isHotel 1', name, types)
        return BusinessType.HOTEL;
    } else if (types.find((element: any) => Hotel.includes(element)) || isHotel) {
        console.log('isHotel 2', name, types)
        return BusinessType.HOTEL;
    }
    //Restaurant
    if (types.filter((element: any) => Restaurant.includes(element)).length > 0 && isRestaurant) {
        console.log('isRestaurant 1', name, types)
        return BusinessType.RESTAURANT;
    } else if (types.filter((element: any) => Restaurant.includes(element)).length > 0 || isRestaurant) {
        console.log('isRestaurant 2', name, types)
        return BusinessType.RESTAURANT;
    }
    //


    //Home Stays
    if (types.filter((element: any) => HomeStays.includes(element)).length > 0 && isHomeStays) {
        console.log('isHomeStays 1', name, types)
        return BusinessType.HOME_STAYS;
    } else if (types.filter((element: any) => HomeStays.includes(element)).length > 0 || isHomeStays) {
        console.log('isHomeStays 2', name, types)
        return BusinessType.HOME_STAYS;
    }

    //Marriage Banquets
    if (types.filter((element: any) => MarriageBanquets.includes(element)).length > 0 && isMarriageBanquets) {
        console.log('isMarriageBanquets 1', name, types)
        return BusinessType.MARRIAGE_BANQUETS;
    } else if (types.filter((element: any) => MarriageBanquets.includes(element)).length > 0 || isMarriageBanquets) {
        console.log('isMarriageBanquets 2', name, types)
        return BusinessType.MARRIAGE_BANQUETS;
    }
}