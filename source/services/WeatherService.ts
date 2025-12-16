import axios from "axios";
import { AppConfig } from "../config/constants";

interface AirPollutionReport {
    coord: Coord
    list: List[]
}
interface Coord {
    lon: number
    lat: number
}
interface List {
    main: Main
    components: Components
    dt: number
}
interface Main {
    aqi: number
}
interface Components {
    co: number
    no: number
    no2: number
    o3: number
    so2: number
    pm2_5: number
    pm10: number
    nh3: number
}

interface WeatherReport {
    coord: Coord
    weather: Weather[]
    base: string
    main: {
        temp: number
        feels_like: number
        temp_min: number
        temp_max: number
        pressure: number
        humidity: number
        sea_level: number
        grnd_level: number
    }
    visibility: number
    wind: Wind
    clouds: Clouds
    dt: number
    sys: Sys
    timezone: number
    id: number
    name: string
    cod: number
}
interface Weather {
    id: number
    main: string
    description: string
    icon: string
}

interface Wind {
    speed: number
    deg: number
    gust: number
}
interface Clouds {
    all: number
}
interface Sys {
    country: string
    sunrise: number
    sunset: number
}

class WeatherService {
    static appid: string = AppConfig.OPEN_WEATHER_API;
    static async airPollution(lat: number, lng: number) {
        try {
            const data = await axios.get('https://api.openweathermap.org/data/2.5/air_pollution', {
                params: {
                    lat,
                    lon: lng,
                    appid: this.appid
                }
            });
            return data.data as AirPollutionReport;
        } catch (error) {
            throw error;
        }
    }
    static async weather(lat: number, lng: number) {
        try {
            const data = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
                params: {
                    lat,
                    lon: lng,
                    appid: this.appid
                }
            });
            return data.data as WeatherReport;
        } catch (error) {
            throw error;
        }
    }
}

export default WeatherService;