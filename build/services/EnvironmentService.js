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
const constants_1 = require("../config/constants");
const WeatherService_1 = __importDefault(require("./WeatherService"));
const RedisClient_1 = require("./RedisClient");
function aqiLabelFromIndex(idx) {
    switch (idx) {
        case 1:
            return "Good";
        case 2:
            return "Fair";
        case 3:
            return "Moderate";
        case 4:
            return "Poor";
        case 5:
            return "Very Poor";
        default:
            return null;
    }
}
function kToC(k) {
    if (k === null || k === undefined || Number.isNaN(Number(k)))
        return null;
    return Math.round((Number(k) - 273.15) * 10) / 10;
}
function isValidLatLng(lat, lng) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng))
        return false;
    if (lat < -90 || lat > 90)
        return false;
    if (lng < -180 || lng > 180)
        return false;
    return true;
}
class EnvironmentService {
    static getForLocation(args) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            const { cacheKey, lat, lng } = args;
            const cacheSeconds = (_a = args.cacheSeconds) !== null && _a !== void 0 ? _a : 60 * 30;
            if (!constants_1.AppConfig.OPEN_WEATHER_API) {
                return {
                    weatherReport: null,
                    summary: {
                        lat,
                        lng,
                        aqiIndex: null,
                        aqiLabel: null,
                        tempK: null,
                        tempMinK: null,
                        tempMaxK: null,
                        tempC: null,
                        tempMinC: null,
                        tempMaxC: null,
                        unavailableReason: "OPEN_WEATHER_API is not configured",
                    },
                };
            }
            if (!isValidLatLng(lat, lng)) {
                return {
                    weatherReport: null,
                    summary: {
                        lat,
                        lng,
                        aqiIndex: null,
                        aqiLabel: null,
                        tempK: null,
                        tempMinK: null,
                        tempMaxK: null,
                        tempC: null,
                        tempMinC: null,
                        tempMaxC: null,
                        unavailableReason: "Invalid latitude/longitude",
                    },
                };
            }
            const redisKey = `env::${cacheKey}`;
            try {
                const cached = yield RedisClient_1.RedisClient.get(redisKey);
                if (cached) {
                    return JSON.parse(cached);
                }
            }
            catch (_m) {
                // cache failures are non-fatal
            }
            try {
                const [airPollution, weather] = yield Promise.all([
                    WeatherService_1.default.airPollution(lat, lng),
                    // IMPORTANT: Keep OpenWeather default "standard" units (Kelvin) for backward-compat with clients
                    WeatherService_1.default.weather(lat, lng),
                ]);
                const aqiIndex = (_e = (_d = (_c = (_b = airPollution === null || airPollution === void 0 ? void 0 : airPollution.list) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.main) === null || _d === void 0 ? void 0 : _d.aqi) !== null && _e !== void 0 ? _e : null;
                const tempK = (_g = (_f = weather === null || weather === void 0 ? void 0 : weather.main) === null || _f === void 0 ? void 0 : _f.temp) !== null && _g !== void 0 ? _g : null;
                const tempMinK = (_j = (_h = weather === null || weather === void 0 ? void 0 : weather.main) === null || _h === void 0 ? void 0 : _h.temp_min) !== null && _j !== void 0 ? _j : null;
                const tempMaxK = (_l = (_k = weather === null || weather === void 0 ? void 0 : weather.main) === null || _k === void 0 ? void 0 : _k.temp_max) !== null && _l !== void 0 ? _l : null;
                const payload = {
                    weatherReport: Object.assign(Object.assign({}, weather), { airPollution }),
                    summary: {
                        lat,
                        lng,
                        aqiIndex,
                        aqiLabel: aqiLabelFromIndex(aqiIndex),
                        tempK,
                        tempMinK,
                        tempMaxK,
                        tempC: kToC(tempK),
                        tempMinC: kToC(tempMinK),
                        tempMaxC: kToC(tempMaxK),
                    },
                };
                try {
                    yield RedisClient_1.RedisClient.set(redisKey, JSON.stringify(payload), { EX: cacheSeconds });
                }
                catch (_o) {
                    // non-fatal
                }
                return payload;
            }
            catch (err) {
                const payload = {
                    weatherReport: null,
                    summary: {
                        lat,
                        lng,
                        aqiIndex: null,
                        aqiLabel: null,
                        tempK: null,
                        tempMinK: null,
                        tempMaxK: null,
                        tempC: null,
                        tempMinC: null,
                        tempMaxC: null,
                        unavailableReason: (err === null || err === void 0 ? void 0 : err.message) ? String(err.message) : "Failed to fetch environment data",
                    },
                };
                return payload;
            }
        });
    }
}
exports.default = EnvironmentService;
