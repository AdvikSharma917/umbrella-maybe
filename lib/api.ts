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

type ApiRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ApiRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'AbortError'
  );
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asFiniteNumber(value: unknown, fallback = 0): number {
  return isFiniteNumber(value) ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

function asNumberArray(value: unknown, fallback = 0): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => asFiniteNumber(item, fallback));
}

export function isValidCity(value: unknown): value is City {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isFiniteNumber(value.id) &&
    isNonEmptyString(value.name) &&
    isFiniteNumber(value.latitude) &&
    isFiniteNumber(value.longitude) &&
    isNonEmptyString(value.country) &&
    isNonEmptyString(value.country_code) &&
    isNonEmptyString(value.timezone) &&
    (value.admin1 === undefined || typeof value.admin1 === 'string')
  );
}

function normalizeCity(value: unknown): City | null {
  if (!isValidCity(value)) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    latitude: value.latitude,
    longitude: value.longitude,
    country: value.country,
    country_code: value.country_code,
    admin1: value.admin1,
    timezone: value.timezone
  };
}

function normalizeWeatherData(value: unknown): WeatherData {
  if (!isRecord(value) || !isRecord(value.current) || !isRecord(value.hourly) || !isRecord(value.daily)) {
    throw new Error('Incomplete weather data received from API');
  }

  const current = {
    time: asString(value.current.time),
    temperature_2m: asFiniteNumber(value.current.temperature_2m),
    apparent_temperature: asFiniteNumber(value.current.apparent_temperature),
    precipitation: asFiniteNumber(value.current.precipitation),
    weather_code: asFiniteNumber(value.current.weather_code),
    wind_speed_10m: asFiniteNumber(value.current.wind_speed_10m)
  };

  const hourlyTime = asStringArray(value.hourly.time);
  const hourlyTemp = asNumberArray(value.hourly.temperature_2m);
  const hourlyPop = asNumberArray(value.hourly.precipitation_probability);
  const hourlyCodes = asNumberArray(value.hourly.weather_code);
  const hourlyLength = Math.min(hourlyTime.length, hourlyTemp.length, hourlyPop.length, hourlyCodes.length);

  const dailyTime = asStringArray(value.daily.time);
  const dailyCodes = asNumberArray(value.daily.weather_code, current.weather_code);
  const dailyMax = asNumberArray(value.daily.temperature_2m_max, current.temperature_2m);
  const dailyMin = asNumberArray(value.daily.temperature_2m_min, current.temperature_2m);
  const dailyPop = asNumberArray(value.daily.precipitation_probability_max);
  const dailyLength = Math.min(dailyTime.length, dailyCodes.length, dailyMax.length, dailyMin.length, dailyPop.length);

  const fallbackDay = current.time.split('T')[0] || new Date().toISOString().slice(0, 10);

  return {
    current,
    hourly: {
      time: hourlyTime.slice(0, hourlyLength),
      temperature_2m: hourlyTemp.slice(0, hourlyLength),
      precipitation_probability: hourlyPop.slice(0, hourlyLength),
      weather_code: hourlyCodes.slice(0, hourlyLength)
    },
    daily: dailyLength > 0
      ? {
          time: dailyTime.slice(0, dailyLength),
          weather_code: dailyCodes.slice(0, dailyLength),
          temperature_2m_max: dailyMax.slice(0, dailyLength),
          temperature_2m_min: dailyMin.slice(0, dailyLength),
          precipitation_probability_max: dailyPop.slice(0, dailyLength)
        }
      : {
          time: [fallbackDay],
          weather_code: [current.weather_code],
          temperature_2m_max: [current.temperature_2m],
          temperature_2m_min: [current.temperature_2m],
          precipitation_probability_max: [0]
        },
    timezone: asString(value.timezone, 'UTC'),
    timezone_abbreviation: asString(value.timezone_abbreviation, 'UTC')
  };
}

/**
 * Searches for cities by name using Open-Meteo Geocoding API.
 */
export async function searchCities(query: string, options?: { signal?: AbortSignal }): Promise<City[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    query
  )}&count=8&language=en&format=json`;

  try {
    const res = await fetch(url, { signal: options?.signal });
    if (!res.ok) {
      throw new Error(`Failed to fetch cities: ${res.statusText}`);
    }
    const data: unknown = await res.json();
    if (!isRecord(data) || !Array.isArray(data.results)) {
      return [];
    }

    return data.results
      .map(normalizeCity)
      .filter((city): city is City => city !== null);
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    console.error('Error searching cities:', error);
    throw error;
  }
}

/**
 * Fetches weather forecast data for specific coordinates using Open-Meteo Weather API.
 */
export async function fetchWeather(lat: number, lon: number, options?: { signal?: AbortSignal }): Promise<WeatherData> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error('Invalid coordinates for weather lookup');
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;

  try {
    const res = await fetch(url, { signal: options?.signal });
    if (!res.ok) {
      throw new Error(`Failed to fetch weather data: ${res.statusText}`);
    }
    const data: unknown = await res.json();
    return normalizeWeatherData(data);
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    console.error('Error fetching weather:', error);
    throw error;
  }
}
