// import moment from "moment-timezone"
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