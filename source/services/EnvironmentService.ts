import { AppConfig } from "../config/constants";
import WeatherService from "./WeatherService";
import { RedisClient } from "./RedisClient";

export type EnvironmentSummary = {
  lat: number;
  lng: number;
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
      const tempK = weather?.main?.temp ?? null;
      const tempMinK = weather?.main?.temp_min ?? null;
      const tempMaxK = weather?.main?.temp_max ?? null;

      const payload = {
        weatherReport: { ...weather, airPollution },
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


