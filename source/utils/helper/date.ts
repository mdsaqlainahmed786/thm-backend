// import moment from "moment-timezone"
import moment, { utc } from "moment";
export const getTimeStampFromString = (time: string, timeZone?: string) => {
    if (timeZone) {
        // const dateObject: moment.Moment = moment.tz(time, timeZone);
        // const timestamp = dateObject.unix();
        // return timestamp;
    } else {
        // const dateObject: moment.Moment = moment(time);
        // const timestamp = dateObject.unix();
        // return timestamp;
    }

}

export const timeRegEx = /(\d{2}:\d{2}:\d{2})/;


export function calculateNights(checkInDate: string, checkOutDate: string): number {
    // Convert both dates to Date objects (in case they are in string format)
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    // Normalize both dates to midnight to avoid time differences affecting the result
    checkIn.setHours(0, 0, 0, 0);  // Set to midnight
    checkOut.setHours(0, 0, 0, 0);  // Set to midnight

    // Calculate the difference in time (in milliseconds)
    const timeDifference = checkOut.getTime() - checkIn.getTime();

    // Convert time difference from milliseconds to days (24 hours in a day)
    const nights = timeDifference / (1000 * 3600 * 24);

    // Return the result (make sure to return an integer)
    return nights;
}

export function combineDateTime(date: string, time: string) {
    const combinedDateTime = moment.utc(`${date} ${time}`, 'YYYY-MM-DD HH:mm:ss');
    // Format the resulting datetime to ISO 8601 with Z (Zulu Time)
    return combinedDateTime.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
}


export function generateMonthDates(offsets: number[]) {
    const dates: string[] = [];
    const today = moment();
    const maxEndDate = moment().add(3, 'months').endOf('day'); // 3 months from today
    console.log(offsets);
    offsets.map((month) => {
        const year = moment().year();
        //  const start = moment({ year, month }).startOf('month');
        //const end = moment({ year, month }).endOf('month');


        const monthStart = moment({ year, month: month }).startOf('month');
        const monthEnd = moment({ year, month: month }).endOf('month');
        // Skip the whole month if it's completely outside the 3-month window
        if (monthEnd.isBefore(today) || monthStart.isAfter(maxEndDate)) {
            return;
        }
        const start = moment.max(monthStart, today);
        const end = moment.min(monthEnd, maxEndDate);
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
};

export function generateDateFromRange(startDate: Date, endDate: Date) {
    const result: string[] = [];

    // const start = moment(startDate);
    // const end = moment(endDate);

    const start = moment(); // today
    const maxEnd = moment().add(3, 'months'); // max range is 3 months from today
    const end = moment.min(moment(endDate), maxEnd); // pick the earlier of actual endDate or 3 months ahead

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