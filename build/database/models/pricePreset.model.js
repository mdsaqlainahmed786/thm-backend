"use strict";
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
exports.generatePricePresetForRoom = exports.PricePresetType = void 0;
const mongoose_1 = require("mongoose");
const date_1 = require("../../utils/helper/date");
const room_model_1 = __importDefault(require("./room.model"));
const roomPrices_model_1 = __importDefault(require("./demo/roomPrices.model"));
const moment_1 = __importDefault(require("moment"));
const basic_1 = require("../../utils/helper/basic");
var PricePresetType;
(function (PricePresetType) {
    PricePresetType["MONTHLY"] = "monthly";
    PricePresetType["QUARTERLY"] = "quarterly";
    PricePresetType["CUSTOM"] = "custom";
})(PricePresetType || (exports.PricePresetType = PricePresetType = {}));
const PricePresetSchema = new mongoose_1.Schema({
    businessProfileID: { type: mongoose_1.Schema.Types.ObjectId, ref: "BusinessProfile", required: true },
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
}, {
    timestamps: true
});
PricePresetSchema.set('toObject', { virtuals: true });
PricePresetSchema.set('toJSON', { virtuals: true });
const PricePreset = (0, mongoose_1.model)('PricePreset', PricePresetSchema);
exports.default = PricePreset;
function generatePricePresetForRoom(pricePresetID) {
    return __awaiter(this, void 0, void 0, function* () {
        const pricePreset = yield PricePreset.findOne({ _id: pricePresetID });
        let priceArray = [];
        if (pricePreset) {
            const rooms = yield room_model_1.default.find({ businessProfileID: pricePreset.businessProfileID });
            console.log("Rooms found for price preset:", rooms);
            //Custom price preset 
            if (pricePreset.type === PricePresetType.CUSTOM) {
                const startDate = pricePreset.startDate;
                const endDate = pricePreset.endDate;
                const dates = (0, date_1.generateDateFromRange)(startDate, endDate);
                console.log(dates);
                yield Promise.all(rooms.map((room) => __awaiter(this, void 0, void 0, function* () {
                    const generatePrice = pricesArray(dates, pricePreset, room);
                    priceArray = [...priceArray, ...generatePrice];
                })));
            }
            if (pricePreset.type === PricePresetType.MONTHLY) {
                const dates = (0, date_1.generateMonthDates)(pricePreset.months);
                console.log(dates);
                yield Promise.all(rooms.map((room) => __awaiter(this, void 0, void 0, function* () {
                    const generatePrice = pricesArray(dates, pricePreset, room);
                    priceArray = [...priceArray, ...generatePrice];
                })));
            }
            if (pricePreset.type === PricePresetType.QUARTERLY) {
                const dates = (0, date_1.generateMonthDates)(pricePreset.months);
                console.log(dates);
                yield Promise.all(rooms.map((room) => __awaiter(this, void 0, void 0, function* () {
                    const generatePrice = pricesArray(dates, pricePreset, room);
                    priceArray = [...priceArray, ...generatePrice];
                })));
            }
        }
        console.log(priceArray);
        return yield roomPrices_model_1.default.create(priceArray);
    });
}
exports.generatePricePresetForRoom = generatePricePresetForRoom;
const pricesArray = (dates, pricePreset, room) => {
    let loopIndex = 0;
    let lastSlab = "";
    let priceArray = [];
    dates.map((date, index) => {
        /*** Price Preset */
        const pricePresetID = pricePreset.id;
        const price = pricePreset.price;
        const weekendPrice = pricePreset.weekendPrice;
        const isActive = pricePreset.isActive;
        /*** Room  */
        const roomID = room.id;
        const pricePerNight = room.pricePerNight;
        const day = (0, moment_1.default)(date).day();
        const isWeekend = day === 0 || day === 6;
        let currentSlab = "";
        if (day === 0) {
            currentSlab = "sunday";
        }
        else if (day === 6) {
            currentSlab = "saturday";
        }
        else {
            currentSlab = "weekday";
        }
        ;
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
            lastPrice = tempPriceArray === null || tempPriceArray === void 0 ? void 0 : tempPriceArray.appliedPrice;
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
                pricePerNight: (0, basic_1.parseFloatToFixed)(pricePerNight, 2),
                pricePercentage: price,
                weekendPricePercentage: isWeekend ? weekendPrice : 0,
                days: ++index,
                appliedPrice: (0, basic_1.parseFloatToFixed)(appliedPrice, 2),
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
                pricePerNight: (0, basic_1.parseFloatToFixed)(pricePerNight, 2),
                pricePercentage: price,
                weekendPricePercentage: isWeekend ? weekendPrice : 0,
                days: ++index,
                appliedPrice: (0, basic_1.parseFloatToFixed)(appliedPrice, 2),
            });
        }
    });
    return priceArray;
};
