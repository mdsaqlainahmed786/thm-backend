import { Types, Schema } from "mongoose";
import crypto from 'crypto';
import { AppConfig } from "../../config/constants";
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
export function isObjectIdInArray(objectId: Types.ObjectId | string, array: any[]): boolean {
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


// export function isTimeInGivenRange(startTime: string, endTime: string, givenTime: string) {
//     // Convert the combined given date-time to a Moment object
//     const momentGivenTime = moment(givenTime, 'HH:mm');
//     // Convert the start and end times to Moment objects
//     const momentStartTime = moment(startTime, 'HH:mm');
//     const momentEndTime = moment(endTime, 'HH:mm');
//     // Check if the given time is between the start and end times (inclusive)
//     console.log(momentGivenTime);
//     console.log(momentStartTime);
//     console.log(momentEndTime);
//     return momentGivenTime.isBetween(momentStartTime, momentEndTime, null, '[]');
// }


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
