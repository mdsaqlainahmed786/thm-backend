import { Document, Model, Schema, model, Types } from "mongoose";
import { MongoID, CurrencyCode, RoomType, BedType, MealPlan } from "../../common";
import { generateDateFromRange, generateMonthDates } from "../../utils/helper/date";
import Room from "./room.model";
import RoomPrices from "./demo/roomPrices.model";
import moment from "moment";
import { parseFloatToFixed } from "../../utils/helper/basic";
export enum PricePresetType {
    MONTHLY = "monthly",
    QUARTERLY = "quarterly",
    CUSTOM = "custom"
}

interface MonthlyPricePreset extends Document {
    months: number[];
    weeks: number[];
}


interface CustomPricePreset extends Document {
    startDate: Date;
    endDate: Date;
}

interface IPricePreset extends MonthlyPricePreset, CustomPricePreset {
    businessProfileID: MongoID;
    type: string;
    price: number;
    weekendPrice: number;
    isActive: boolean;
}


const PricePresetSchema: Schema = new Schema<IPricePreset>(
    {
        businessProfileID: { type: Schema.Types.ObjectId, ref: "BusinessProfile", required: true },
        months: [
            { type: Number }
        ],
        weeks: [
            { type: Number }
        ],
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
        type: {
            type: String,
            enum: PricePresetType
        },
        price: {
            type: Number,
            required: true
        },
        weekendPrice: {
            type: Number,
            required: true
        },
        isActive: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);
PricePresetSchema.set('toObject', { virtuals: true });
PricePresetSchema.set('toJSON', { virtuals: true });

export interface IPricePresetModel extends Model<IPricePreset> {
}

const PricePreset = model<IPricePreset, IPricePresetModel>('PricePreset', PricePresetSchema);
export default PricePreset;

interface PricePreset {
    isActive: boolean;
    pricePresetID: string;
    roomID: string;
    isWeekend: boolean;
    date: string;
    pricePerNight: number;
    pricePercentage: number;
    weekendPricePercentage: number;
    days: number;
    appliedPrice: number;
}

export async function generatePricePresetForRoom(pricePresetID: MongoID) {
    const pricePreset = await PricePreset.findOne({ _id: pricePresetID });
    let priceArray: PricePreset[] = [];
    if (pricePreset) {
        const rooms = await Room.find({ businessProfileID: pricePreset.businessProfileID });
        console.log("Rooms found for price preset:", rooms);
        //Custom price preset 
        if (pricePreset.type === PricePresetType.CUSTOM) {
            const startDate = pricePreset.startDate;
            const endDate = pricePreset.endDate;
            const dates = generateDateFromRange(startDate, endDate);
            console.log(dates);
            await Promise.all(rooms.map(async (room) => {
                const generatePrice = pricesArray(
                    dates,
                    pricePreset,
                    room
                )
                priceArray = [...priceArray, ...generatePrice]
            }));
        }

        if (pricePreset.type === PricePresetType.MONTHLY) {
            const dates = generateMonthDates(pricePreset.months);
            console.log(dates);
            await Promise.all(rooms.map(async (room) => {
                const generatePrice = pricesArray(
                    dates,
                    pricePreset,
                    room
                )
                priceArray = [...priceArray, ...generatePrice]
            }));
        }
        if (pricePreset.type === PricePresetType.QUARTERLY) {
            const dates = generateMonthDates(pricePreset.months);
            console.log(dates);
            await Promise.all(rooms.map(async (room) => {
                const generatePrice = pricesArray(
                    dates,
                    pricePreset,
                    room
                )
                priceArray = [...priceArray, ...generatePrice]
            }));
        }
    }
    console.log(priceArray)
    return await RoomPrices.create(priceArray);
}

const pricesArray = (dates: string[], pricePreset: any, room: any) => {
    let loopIndex = 0;
    let lastSlab = "";
    let priceArray: PricePreset[] = [];
    dates.map((date, index) => {
        /*** Price Preset */
        const pricePresetID = pricePreset.id;
        const price = pricePreset.price;
        const weekendPrice = pricePreset.weekendPrice;
        const isActive = pricePreset.isActive;
        /*** Room  */
        const roomID = room.id;
        const pricePerNight = room.pricePerNight;

        const day = moment(date).day();
        const isWeekend = day === 0 || day === 6;

        let currentSlab = "";
        if (day === 0) {
            currentSlab = "sunday"

        } else if (day === 6) {
            currentSlab = "saturday"
        }
        else {
            currentSlab = "weekday"

        };
        // Increase loopIndex only when slab changes
        let increasePrice = false;
        if (currentSlab !== lastSlab) {
            loopIndex++;
            lastSlab = currentSlab;
            increasePrice = true;
        }
        // console.log("loopIndex", loopIndex)


        // console.log(priceArray);
        let lastPrice = pricePerNight;
        let tempPriceArray = [...priceArray].sort((a, b) => a.days - b.days).pop();
        if (tempPriceArray) {
            lastPrice = tempPriceArray?.appliedPrice;
        }

        if (currentSlab === "weekday") {
            let increasedPrice = (pricePerNight * price / 100);
            if (!increasePrice) {
                increasedPrice = 0;
            }
            const appliedPrice = parseFloat(lastPrice) + increasedPrice;

            console.log("date", loopIndex);
            console.log("date", date);
            console.log("last Price", lastPrice);
            console.log("increasedPrice", increasedPrice);
            console.log("finalPrice", appliedPrice, "\n");

            priceArray.push({
                isActive,
                pricePresetID,
                roomID,
                isWeekend,
                date,
                pricePerNight: parseFloatToFixed(pricePerNight, 2),
                pricePercentage: price,
                weekendPricePercentage: isWeekend ? weekendPrice : 0,
                days: ++index,
                appliedPrice: parseFloatToFixed(appliedPrice, 2),
            });
        }
        if (currentSlab === "saturday" || currentSlab === "sunday") {
            let increasedPrice = (pricePerNight * (price + weekendPrice) / 100);
            if (!increasePrice) {
                increasedPrice = 0;
            }
            const appliedPrice = parseFloat(lastPrice) + increasedPrice;
            console.log("date", loopIndex);
            console.log("date", date);
            console.log("last Price", lastPrice);
            console.log("increasedPrice", increasedPrice);
            console.log("finalPrice", appliedPrice, "\n");

            priceArray.push({
                isActive,
                pricePresetID,
                roomID,
                isWeekend,
                date,
                pricePerNight: parseFloatToFixed(pricePerNight, 2),
                pricePercentage: price,
                weekendPricePercentage: isWeekend ? weekendPrice : 0,
                days: ++index,
                appliedPrice: parseFloatToFixed(appliedPrice, 2),
            });
        }
    });
    return priceArray;
}