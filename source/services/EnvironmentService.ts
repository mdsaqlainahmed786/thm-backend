import { AppConfig } from "../config/constants";
import WeatherService from "./WeatherService";
import { RedisClient } from "./RedisClient";

export type EnvironmentSummary = {
  lat: number;
  lng: number;
  /** Computed AQI value (e.g. 168). */
  aqi: number | null;
  /** Which standard the computed AQI value uses. */
  aqiStandard: "US_EPA" | null;
  /** Which pollutant drove the final AQI value. */
  aqiDominantPollutant: "pm2_5" | "pm10" | null;
  /**
   * OpenWeather "Air Quality Index" (1..5):
   * 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor
   */
  aqiIndex: number | null;
  aqiLabel: string | null;
  /** Temperature in Kelvin from OpenWeather (standard units) */
  tempK: number | null;
  tempMinK: number | null;
  tempMaxK: number | null;
  /** Convenience conversions */
  tempC: number | null;
  tempMinC: number | null;
  tempMaxC: number | null;
  /** When data is not available, this explains why (best-effort). */
  unavailableReason?: string;
};

function aqiLabelFromIndex(idx: number | null | undefined) {
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

function kToC(k: number | null | undefined) {
  if (k === null || k === undefined || Number.isNaN(Number(k))) return null;
  return Math.round((Number(k) - 273.15) * 10) / 10;
}

type AqiBreakpoints = { cLow: number; cHigh: number; iLow: number; iHigh: number }[];

const PM25_US_EPA: AqiBreakpoints = [
  { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },
  { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
  { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
  { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
  { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
  { cLow: 250.5, cHigh: 350.4, iLow: 301, iHigh: 400 },
  { cLow: 350.5, cHigh: 500.4, iLow: 401, iHigh: 500 },
];

const PM10_US_EPA: AqiBreakpoints = [
  { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
  { cLow: 55, cHigh: 154, iLow: 51, iHigh: 100 },
  { cLow: 155, cHigh: 254, iLow: 101, iHigh: 150 },
  { cLow: 255, cHigh: 354, iLow: 151, iHigh: 200 },
  { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300 },
  { cLow: 425, cHigh: 504, iLow: 301, iHigh: 400 },
  { cLow: 505, cHigh: 604, iLow: 401, iHigh: 500 },
];

function computeAqiFromBreakpoints(concentration: number | null | undefined, bps: AqiBreakpoints) {
  if (concentration === null || concentration === undefined) return null;
  const c = Number(concentration);
  if (!Number.isFinite(c) || c < 0) return null;

  const bp = bps.find((x) => c >= x.cLow && c <= x.cHigh) ?? bps[bps.length - 1];
  if (!bp) return null;
  const { cLow, cHigh, iLow, iHigh } = bp;
  if (cHigh === cLow) return null;

  const aqi = ((iHigh - iLow) / (cHigh - cLow)) * (c - cLow) + iLow;
  // US AQI is usually rounded to nearest integer
  return Math.round(aqi);
}

function isValidLatLng(lat: number, lng: number) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  // In this app, (0,0) almost always means "not set"
  if (lat === 0 && lng === 0) return false;
  return true;
}

class EnvironmentService {
  static async getForLocation(args: {
    cacheKey: string;
    lat: number;
    lng: number;
    /** Cache seconds (defaults to 30 minutes) */
    cacheSeconds?: number;
  }): Promise<{ weatherReport: any | null; summary: EnvironmentSummary | null }> {
    const { cacheKey, lat, lng } = args;
    const cacheSeconds = args.cacheSeconds ?? 60 * 30;

    if (!AppConfig.OPEN_WEATHER_API) {
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

    const redisKey = `env::${cacheKey}`;
    try {
      const cached = await RedisClient.get(redisKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // cache failures are non-fatal
    }

    try {
      const [airPollution, weather] = await Promise.all([
        WeatherService.airPollution(lat, lng),
        // IMPORTANT: Keep OpenWeather default "standard" units (Kelvin) for backward-compat with clients
        WeatherService.weather(lat, lng),
      ]);

      const aqiIndex = airPollution?.list?.[0]?.main?.aqi ?? null;
      const components = airPollution?.list?.[0]?.components ?? null;
      const pm2_5 = components?.pm2_5 ?? null;
      const pm10 = components?.pm10 ?? null;

      const pm25Aqi = computeAqiFromBreakpoints(pm2_5, PM25_US_EPA);
      const pm10Aqi = computeAqiFromBreakpoints(pm10, PM10_US_EPA);
      const computedAqi =
        pm25Aqi === null && pm10Aqi === null
          ? null
          : Math.max(pm25Aqi ?? 0, pm10Aqi ?? 0);
      const dominant =
        computedAqi === null
          ? null
          : (pm25Aqi ?? -1) >= (pm10Aqi ?? -1)
            ? "pm2_5"
            : "pm10";

      const tempK = weather?.main?.temp ?? null;
      const tempMinK = weather?.main?.temp_min ?? null;
      const tempMaxK = weather?.main?.temp_max ?? null;

      const payload = {
        weatherReport: { ...weather, airPollution },
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
        } as EnvironmentSummary,
      };

      try {
        await RedisClient.set(redisKey, JSON.stringify(payload), { EX: cacheSeconds });
      } catch {
        // non-fatal
      }

      return payload;
    } catch (err: any) {
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
          unavailableReason: err?.message ? String(err.message) : "Failed to fetch environment data",
        } as EnvironmentSummary,
      };

      return payload;
    }
  }
}

export default EnvironmentService;


