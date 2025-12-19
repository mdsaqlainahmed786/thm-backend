"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDateFromRange = exports.generateMonthDates = exports.combineDateTime = exports.calculateNights = exports.timeRegEx = exports.getTimeStampFromString = void 0;
// import moment from "moment-timezone"
const moment_1 = __importDefault(require("moment"));
const getTimeStampFromString = (time, timeZone) => {
    if (timeZone) {
        // const dateObject: moment.Moment = moment.tz(time, timeZone);
        // const timestamp = dateObject.unix();
        // return timestamp;
    }
    else {
        // const dateObject: moment.Moment = moment(time);
        // const timestamp = dateObject.unix();
        // return timestamp;
    }
};
exports.getTimeStampFromString = getTimeStampFromString;
exports.timeRegEx = /(\d{2}:\d{2}:\d{2})/;
function calculateNights(checkInDate, checkOutDate) {
    // Convert both dates to Date objects (in case they are in string format)
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    // Normalize both dates to midnight to avoid time differences affecting the result
    checkIn.setHours(0, 0, 0, 0); // Set to midnight
    checkOut.setHours(0, 0, 0, 0); // Set to midnight
    // Calculate the difference in time (in milliseconds)
    const timeDifference = checkOut.getTime() - checkIn.getTime();
    // Convert time difference from milliseconds to days (24 hours in a day)
    const nights = timeDifference / (1000 * 3600 * 24);
    // Return the result (make sure to return an integer)
    return nights;
}
exports.calculateNights = calculateNights;
function combineDateTime(date, time) {
    const combinedDateTime = moment_1.default.utc(`${date} ${time}`, 'YYYY-MM-DD HH:mm:ss');
    // Format the resulting datetime to ISO 8601 with Z (Zulu Time)
    return combinedDateTime.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
}
exports.combineDateTime = combineDateTime;
function generateMonthDates(offsets) {
    const dates = [];
    const today = (0, moment_1.default)();
    const maxEndDate = (0, moment_1.default)().add(3, 'months').endOf('day'); // 3 months from today
    console.log(offsets);
    offsets.map((month) => {
        const year = (0, moment_1.default)().year();
        //  const start = moment({ year, month }).startOf('month');
        //const end = moment({ year, month }).endOf('month');
        const monthStart = (0, moment_1.default)({ year, month: month }).startOf('month');
        const monthEnd = (0, moment_1.default)({ year, month: month }).endOf('month');
        // Skip the whole month if it's completely outside the 3-month window
        if (monthEnd.isBefore(today) || monthStart.isAfter(maxEndDate)) {
            return;
        }
        const start = moment_1.default.max(monthStart, today);
        const end = moment_1.default.min(monthEnd, maxEndDate);
        let current = start.clone();
        while (current <= end) {
            const day = current.day(); // Sunday = 0, Monday = 1, ..., Saturday = 6
            // if (day === 0 || day === 1 || day === 6) {
            dates.push(current.format('YYYY-MM-DD'));
            // }
            current.add(1, 'day');
        }
    });
    return dates;
}
exports.generateMonthDates = generateMonthDates;
;
function generateDateFromRange(startDate, endDate) {
    const result = [];
    // const start = moment(startDate);
    // const end = moment(endDate);
    const start = (0, moment_1.default)(); // today
    const maxEnd = (0, moment_1.default)().add(3, 'months'); // max range is 3 months from today
    const end = moment_1.default.min((0, moment_1.default)(endDate), maxEnd); // pick the earlier of actual endDate or 3 months ahead
    console.log(start, end, maxEnd);
    if (!start.isValid() || !end.isValid()) {
        throw new Error('Invalid date format. Use YYYY-MM-DD.');
    }
    let current = start.clone();
    while (current.isSameOrBefore(end)) {
        const day = current.day(); // 0 = Sunday, 1 = Monday, 6 = Saturday
        // if (day === 0 || day === 1 || day === 6) {
        result.push(current.format('YYYY-MM-DD'));
        // }
        current.add(1, 'day');
    }
    return result;
}
exports.generateDateFromRange = generateDateFromRange;
