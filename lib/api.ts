export interface City {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  country_code: string;
  admin1?: string; // state/region
  timezone: string;
}

export interface WeatherData {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    weather_code: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
  timezone: string;
  timezone_abbreviation: string;
}

/**
 * Searches for cities by name using Open-Meteo Geocoding API.
 */
export async function searchCities(query: string): Promise<City[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    query
  )}&count=8&language=en&format=json`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch cities: ${res.statusText}`);
    }
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error('Error searching cities:', error);
    throw error;
  }
}

/**
 * Fetches weather forecast data for specific coordinates using Open-Meteo Weather API.
 */
export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch weather data: ${res.statusText}`);
    }
    const data = await res.json();

    if (!data.current || !data.hourly || !data.daily) {
      throw new Error('Incomplete weather data received from API');
    }

    return {
      current: {
        time: data.current.time,
        temperature_2m: data.current.temperature_2m,
        apparent_temperature: data.current.apparent_temperature,
        precipitation: data.current.precipitation,
        weather_code: data.current.weather_code,
        wind_speed_10m: data.current.wind_speed_10m
      },
      hourly: {
        time: data.hourly.time,
        temperature_2m: data.hourly.temperature_2m,
        precipitation_probability: data.hourly.precipitation_probability,
        weather_code: data.hourly.weather_code
      },
      daily: {
        time: data.daily.time,
        weather_code: data.daily.weather_code,
        temperature_2m_max: data.daily.temperature_2m_max,
        temperature_2m_min: data.daily.temperature_2m_min,
        precipitation_probability_max: data.daily.precipitation_probability_max
      },
      timezone: data.timezone,
      timezone_abbreviation: data.timezone_abbreviation
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    throw error;
  }
}
