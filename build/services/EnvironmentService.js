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
const PM25_US_EPA = [
    { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },
    { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
    { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
    { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
    { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
    { cLow: 250.5, cHigh: 350.4, iLow: 301, iHigh: 400 },
    { cLow: 350.5, cHigh: 500.4, iLow: 401, iHigh: 500 },
];
const PM10_US_EPA = [
    { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
    { cLow: 55, cHigh: 154, iLow: 51, iHigh: 100 },
    { cLow: 155, cHigh: 254, iLow: 101, iHigh: 150 },
    { cLow: 255, cHigh: 354, iLow: 151, iHigh: 200 },
    { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300 },
    { cLow: 425, cHigh: 504, iLow: 301, iHigh: 400 },
    { cLow: 505, cHigh: 604, iLow: 401, iHigh: 500 },
];
function computeAqiFromBreakpoints(concentration, bps) {
    var _a;
    if (concentration === null || concentration === undefined)
        return null;
    const c = Number(concentration);
    if (!Number.isFinite(c) || c < 0)
        return null;
    const bp = (_a = bps.find((x) => c >= x.cLow && c <= x.cHigh)) !== null && _a !== void 0 ? _a : bps[bps.length - 1];
    if (!bp)
        return null;
    const { cLow, cHigh, iLow, iHigh } = bp;
    if (cHigh === cLow)
        return null;
    const aqi = ((iHigh - iLow) / (cHigh - cLow)) * (c - cLow) + iLow;
    // US AQI is usually rounded to nearest integer
    return Math.round(aqi);
}
function isValidLatLng(lat, lng) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng))
        return false;
    if (lat < -90 || lat > 90)
        return false;
    if (lng < -180 || lng > 180)
        return false;
    // In this app, (0,0) almost always means "not set"
    if (lat === 0 && lng === 0)
        return false;
    return true;
}
class EnvironmentService {
    static getForLocation(args) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
            const { cacheKey, lat, lng } = args;
            const cacheSeconds = (_a = args.cacheSeconds) !== null && _a !== void 0 ? _a : 60 * 30;
            if (!constants_1.AppConfig.OPEN_WEATHER_API) {
                return {
                    weatherReport: null,
                    summary: {
                        lat,
                        lng,
                        aqi: null,
                        aqiStandard: null,
                        aqiDominantPollutant: null,
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
                        aqi: null,
                        aqiStandard: null,
                        aqiDominantPollutant: null,
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
            // Versioned cache key to allow schema evolution without stale payloads.
            const redisKey = `env:v2::${cacheKey}`;
            try {
                const cached = yield RedisClient_1.RedisClient.get(redisKey);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    // Safety: if cache contains an older schema without numeric AQI fields, treat as miss.
                    if ((parsed === null || parsed === void 0 ? void 0 : parsed.summary) && Object.prototype.hasOwnProperty.call(parsed.summary, "aqi")) {
                        return parsed;
                    }
                }
            }
            catch (_s) {
                // cache failures are non-fatal
            }
            try {
                const [airPollution, weather] = yield Promise.all([
                    WeatherService_1.default.airPollution(lat, lng),
                    // IMPORTANT: Keep OpenWeather default "standard" units (Kelvin) for backward-compat with clients
                    WeatherService_1.default.weather(lat, lng),
                ]);
                const aqiIndex = (_e = (_d = (_c = (_b = airPollution === null || airPollution === void 0 ? void 0 : airPollution.list) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.main) === null || _d === void 0 ? void 0 : _d.aqi) !== null && _e !== void 0 ? _e : null;
                const components = (_h = (_g = (_f = airPollution === null || airPollution === void 0 ? void 0 : airPollution.list) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.components) !== null && _h !== void 0 ? _h : null;
                const pm2_5 = (_j = components === null || components === void 0 ? void 0 : components.pm2_5) !== null && _j !== void 0 ? _j : null;
                const pm10 = (_k = components === null || components === void 0 ? void 0 : components.pm10) !== null && _k !== void 0 ? _k : null;
                const pm25Aqi = computeAqiFromBreakpoints(pm2_5, PM25_US_EPA);
                const pm10Aqi = computeAqiFromBreakpoints(pm10, PM10_US_EPA);
                const computedAqi = pm25Aqi === null && pm10Aqi === null
                    ? null
                    : Math.max(pm25Aqi !== null && pm25Aqi !== void 0 ? pm25Aqi : 0, pm10Aqi !== null && pm10Aqi !== void 0 ? pm10Aqi : 0);
                const dominant = computedAqi === null
                    ? null
                    : (pm25Aqi !== null && pm25Aqi !== void 0 ? pm25Aqi : -1) >= (pm10Aqi !== null && pm10Aqi !== void 0 ? pm10Aqi : -1)
                        ? "pm2_5"
                        : "pm10";
                const tempK = (_m = (_l = weather === null || weather === void 0 ? void 0 : weather.main) === null || _l === void 0 ? void 0 : _l.temp) !== null && _m !== void 0 ? _m : null;
                const tempMinK = (_p = (_o = weather === null || weather === void 0 ? void 0 : weather.main) === null || _o === void 0 ? void 0 : _o.temp_min) !== null && _p !== void 0 ? _p : null;
                const tempMaxK = (_r = (_q = weather === null || weather === void 0 ? void 0 : weather.main) === null || _q === void 0 ? void 0 : _q.temp_max) !== null && _r !== void 0 ? _r : null;
                const payload = {
                    weatherReport: Object.assign(Object.assign({}, weather), { airPollution: airPollution
                            ? Object.assign(Object.assign({}, airPollution), { list: Array.isArray(airPollution.list)
                                    ? airPollution.list.map((item, idx) => {
                                        var _a, _b, _c;
                                        if (idx !== 0)
                                            return item;
                                        const oldIndex = (_b = (_a = item === null || item === void 0 ? void 0 : item.main) === null || _a === void 0 ? void 0 : _a.aqi) !== null && _b !== void 0 ? _b : null;
                                        return Object.assign(Object.assign({}, item), { main: Object.assign(Object.assign({}, ((_c = item === null || item === void 0 ? void 0 : item.main) !== null && _c !== void 0 ? _c : {})), { 
                                                // `aqi` should be the numeric AQI value clients expect (e.g. 168).
                                                // Preserve the original OpenWeather index (1..5) as `aqiIndex`.
                                                aqi: computedAqi, aqiIndex: oldIndex }) });
                                    })
                                    : airPollution.list }) : airPollution }),
                    summary: {
                        lat,
                        lng,
                        aqi: computedAqi,
                        aqiStandard: computedAqi === null ? null : "US_EPA",
                        aqiDominantPollutant: dominant,
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
                catch (_t) {
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
                        aqi: null,
                        aqiStandard: null,
                        aqiDominantPollutant: null,
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
