'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { City, WeatherData } from '@/lib/api';
import { fetchWeather, isValidCity, searchCities } from '@/lib/api';
import { getWeatherCondition } from '@/lib/weatherCodes';
import type { HumorMode } from '@/lib/bylineEngine';
import { getByline } from '@/lib/bylineEngine';
import WeatherIcon from '@/components/WeatherIcon';

const DEFAULT_CITY: City = {
  id: 2643743,
  name: 'London',
  latitude: 51.5074,
  longitude: -0.1278,
  country: 'United Kingdom',
  country_code: 'GB',
  admin1: 'England',
  timezone: 'Europe/London'
};

const LOCAL_STORAGE_KEY = 'umbrella_maybe_saved_cities';

type UmbrellaStatus = 'yes' | 'maybe' | 'no';

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'AbortError'
  );
}

function isSameCity(a: City, b: City): boolean {
  return (
    a.id === b.id ||
    (Math.abs(a.latitude - b.latitude) < 0.01 &&
      Math.abs(a.longitude - b.longitude) < 0.01)
  );
}

function getCityLabel(city: City): string {
  return [city.name, city.admin1, city.country].filter(Boolean).join(', ');
}

function clearSavedCitiesStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear saved cities from localStorage:', error);
  }
}

function loadSavedCities(): City[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) {
      return [];
    }
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) {
      clearSavedCitiesStorage();
      return [];
    }
    const validCities = parsed.filter(isValidCity);
    if (validCities.length !== parsed.length) {
      saveSavedCities(validCities);
    }
    return validCities;
  } catch (error) {
    console.error('Failed to load saved cities from localStorage:', error);
    clearSavedCitiesStorage();
    return [];
  }
}

function saveSavedCities(cities: City[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const validCities = Array.isArray(cities) ? cities.filter(isValidCity) : [];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(validCities));
  } catch (error) {
    console.error('Failed to save cities to localStorage:', error);
  }
}

function maxNumber(values: number[], limit = values.length): number {
  return values
    .slice(0, limit)
    .reduce((max, value) => (Number.isFinite(value) ? Math.max(max, value) : max), 0);
}

function getUmbrellaRecommendation(data: WeatherData): { status: UmbrellaStatus; advice: string } {
  const condition = getWeatherCondition(data.current.weather_code);
  const nextTwelveHourPop = maxNumber(data.hourly.precipitation_probability, 12);
  const nextTwoDayPop = maxNumber(data.daily.precipitation_probability_max, 2);
  const rainRisk = Math.max(nextTwelveHourPop, nextTwoDayPop);
  const isCurrentlyWet = data.current.precipitation > 0;

  if (isCurrentlyWet) {
    return {
      status: 'yes',
      advice: 'Rain is already showing up. Bring an umbrella if you are heading out.'
    };
  }

  if (nextTwelveHourPop >= 70 || nextTwoDayPop >= 80) {
    return {
      status: 'yes',
      advice: `Rain risk climbs to ${Math.round(rainRisk)}% soon. An umbrella is the safer call.`
    };
  }

  if (condition.umbrella === 'yes') {
    return {
      status: 'yes',
      advice: condition.advice
    };
  }

  if (nextTwelveHourPop >= 35 || nextTwoDayPop >= 45) {
    return {
      status: 'maybe',
      advice: `Rain risk reaches ${Math.round(rainRisk)}% later. Carrying a small umbrella would be smart.`
    };
  }

  if (condition.umbrella === 'maybe') {
    return {
      status: 'maybe',
      advice: condition.advice
    };
  }

  return {
    status: 'no',
    advice: 'Rain odds stay low in the near forecast. You can probably leave the umbrella behind.'
  };
}

export default function Home() {
  const [mounted, setMounted] = useState(false);

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<City[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Weather States
  const [selectedCity, setSelectedCity] = useState<City>(DEFAULT_CITY);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Saved Cities States
  const [savedCities, setSavedCities] = useState<City[]>([]);
  const [savedCitiesWeather, setSavedCitiesWeather] = useState<Record<number, WeatherData>>({});

  // Settings States
  const [tempUnit, setTempUnit] = useState<'celsius' | 'fahrenheit'>('celsius');
  const [humorMode, setHumorMode] = useState<HumorMode>('default');
  const [showSettings, setShowSettings] = useState(false);

  const [activeIndex, setActiveIndex] = useState(0);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRequestRef = useRef(0);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const settingsModalRef = useRef<HTMLDivElement>(null);
  const settingsWasOpen = useRef(false);

  // Temperature conversion helper
  const convertTemp = useCallback((celsius: number) => {
    if (tempUnit === 'fahrenheit') {
      return (celsius * 9) / 5 + 32;
    }
    return celsius;
  }, [tempUnit]);

  // Update Settings Helpers
  const updateTempUnit = (unit: 'celsius' | 'fahrenheit') => {
    setTempUnit(unit);
    try {
      localStorage.setItem('umbrella_maybe_temp_unit', unit);
    } catch (e) {
      console.error('Failed to save temperature unit to localStorage:', e);
    }
  };

  const updateHumorMode = (mode: HumorMode) => {
    setHumorMode(mode);
    try {
      localStorage.setItem('umbrella_maybe_humor_mode', mode);
    } catch (e) {
      console.error('Failed to save humor mode to localStorage:', e);
    }
  };

  // Hydration safety and settings loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      setSavedCities(loadSavedCities());

      // Load settings from localStorage
      try {
        const savedUnit = localStorage.getItem('umbrella_maybe_temp_unit');
        if (savedUnit === 'celsius' || savedUnit === 'fahrenheit') {
          setTempUnit(savedUnit);
        }
        const savedHumor = localStorage.getItem('umbrella_maybe_humor_mode');
        if (
          savedHumor === 'light' ||
          savedHumor === 'default' ||
          savedHumor === 'high' ||
          savedHumor === 'roast'
        ) {
          setHumorMode(savedHumor);
        }
      } catch (e) {
        console.error('Failed to load settings from localStorage:', e);
      }
    }, 0);
    return () => {
      clearTimeout(timer);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Escape key to close settings
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowSettings(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus management for settings modal — move focus in on open, return it on close
  useEffect(() => {
    if (showSettings) {
      settingsWasOpen.current = true;
      const focusable = settingsModalRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.[0]?.focus();
    } else if (settingsWasOpen.current) {
      settingsButtonRef.current?.focus();
    }
  }, [showSettings]);

  // Sync saved cities to localStorage
  const updateSavedCities = (newCities: City[]) => {
    setSavedCities(newCities);
    saveSavedCities(newCities);
  };

  // Asynchronously fetch weather for all saved cities in parallel
  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function fetchAllSavedWeather() {
      if (savedCities.length === 0) {
        if (active) {
          setSavedCitiesWeather({});
        }
        return;
      }

      const weatherMap: Record<number, WeatherData> = {};
      
      await Promise.all(
        savedCities.map(async (city) => {
          try {
            const data = await fetchWeather(city.latitude, city.longitude, {
              signal: controller.signal
            });
            if (active) {
              weatherMap[city.id] = data;
            }
          } catch (err) {
            if (isAbortError(err)) {
              return;
            }
            console.error(`Failed to fetch weather for saved city: ${city.name}`, err);
          }
        })
      );

      if (active) {
        setSavedCitiesWeather(weatherMap);
      }
    }

    fetchAllSavedWeather();

    return () => {
      active = false;
      controller.abort();
    };
  }, [savedCities]);

  const selectNewCity = useCallback((city: City) => {
    setWeatherData(null);
    setWeatherError(null);
    setSelectedCity(city);
  }, []);

  // Tab key focus trap for the settings modal
  const handleSettingsModalKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !settingsModalRef.current) return;
    const focusable = settingsModalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      const firstResult = searchResults[0];
      selectNewCity(firstResult);
      setSearchQuery('');
      setSearchResults([]);
      setSearchLoading(false);
      setShowResults(false);
    }
  }, [searchResults, selectNewCity]);

  // Load weather when selectedCity changes
  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadWeather() {
      setWeatherError(null);
      setWeatherLoading(true);
      try {
        const data = await fetchWeather(selectedCity.latitude, selectedCity.longitude, {
          signal: controller.signal
        });
        if (active) {
          setWeatherData(data);
        }
      } catch (err) {
        if (isAbortError(err)) {
          return;
        }
        if (active) {
          console.error(err);
          setWeatherError('Failed to load weather data.');
        }
      } finally {
        if (active) {
          setWeatherLoading(false);
        }
      }
    }

    loadWeather();

    return () => {
      active = false;
      controller.abort();
    };
  }, [selectedCity]);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Smooth scroll to a specific index slide
  const scrollToCity = useCallback((index: number) => {
    if (carouselRef.current) {
      isProgrammaticScroll.current = true;
      const width = carouselRef.current.clientWidth;
      carouselRef.current.scrollTo({
        left: index * width,
        behavior: 'smooth'
      });
      setActiveIndex(index);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 600);
    }
  }, []);

  // Compute carousel cities list (saved + selected temporary preview if not saved)
  const carouselCities = useMemo(() => {
    const isSelectedSaved = savedCities.some((city) => isSameCity(city, selectedCity));

    return isSelectedSaved 
      ? savedCities 
      : [...savedCities, selectedCity];
  }, [savedCities, selectedCity]);
  const activeCarouselIndex = Math.min(activeIndex, Math.max(carouselCities.length - 1, 0));

  // Auto-scroll carousel when selectedCity changes (e.g. from search or list click)
  useEffect(() => {
    const index = carouselCities.findIndex((city) => isSameCity(city, selectedCity));
    if (index !== -1 && index !== activeCarouselIndex) {
      scrollToCity(index);
    }
  }, [selectedCity, carouselCities, activeCarouselIndex, scrollToCity]);

  // Debounced search logic for Geocoding API
  useEffect(() => {
    const query = searchQuery.trim();
    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;

    if (query.length < 2) {
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      if (searchRequestRef.current === requestId) {
        setSearchLoading(true);
        setSearchError(null);
      }

      try {
        const results = await searchCities(query, { signal: controller.signal });
        if (searchRequestRef.current === requestId) {
          setSearchResults(results);
          setShowResults(true);
        }
      } catch (err) {
        if (isAbortError(err)) {
          return;
        }
        if (searchRequestRef.current === requestId) {
          console.error(err);
          setSearchError('Could not find cities.');
          setSearchResults([]);
        }
      } finally {
        if (searchRequestRef.current === requestId) {
          setSearchLoading(false);
        }
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  // Detect which slide is currently snapped to update active state
  const handleCarouselScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isProgrammaticScroll.current) return;
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.clientWidth;
    if (width === 0) return;
    const index = Math.round(scrollLeft / width);
    if (index >= 0 && index < carouselCities.length && index !== activeIndex) {
      setActiveIndex(index);
      selectNewCity(carouselCities[index]);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin" />
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Weather-based gradient background logic (for pages and cards)
  const getGradientClasses = (weatherCode: number, timeStr?: string, isCard: boolean = false) => {
    let isNight = false;
    if (timeStr) {
      const parts = timeStr.split('T');
      if (parts.length >= 2) {
        const hour = parseInt(parts[1].split(':')[0], 10);
        if (hour < 6 || hour >= 20) {
          isNight = true;
        }
      }
    }

    if (isNight) {
      return isCard
        ? 'from-slate-900/40 via-slate-950/30 to-indigo-950/20 border-white/5'
        : 'from-slate-950 via-slate-950 to-zinc-950';
    }

    const condition = getWeatherCondition(weatherCode);
    switch (condition.iconName) {
      case 'sunny':
        return isCard
          ? 'from-amber-500/10 via-orange-500/5 to-slate-900/30 border-amber-500/15'
          : 'from-amber-950/20 via-slate-900 to-slate-950';
      case 'partly-cloudy':
      case 'cloudy':
        return isCard
          ? 'from-slate-500/10 via-slate-600/5 to-zinc-950/30 border-slate-500/15'
          : 'from-slate-900 via-slate-900 to-slate-950';
      case 'foggy':
        return isCard
          ? 'from-zinc-500/10 via-slate-600/5 to-zinc-950/30 border-zinc-500/15'
          : 'from-zinc-900 via-slate-900 to-zinc-950';
      case 'drizzle':
      case 'rainy':
        return isCard
          ? 'from-blue-500/10 via-indigo-600/5 to-zinc-950/30 border-blue-500/15'
          : 'from-blue-950/30 via-slate-900 to-slate-950';
      case 'snowy':
        return isCard
          ? 'from-sky-400/10 via-slate-600/5 to-slate-950/30 border-sky-400/15'
          : 'from-sky-950/20 via-slate-900 to-slate-950';
      case 'thunderstorm':
        return isCard
          ? 'from-purple-500/15 via-indigo-600/5 to-zinc-950/30 border-purple-500/20'
          : 'from-purple-950/30 via-slate-900 to-slate-950';
      default:
        return isCard
          ? 'from-white/5 to-white/0 border-white/5'
          : 'from-slate-950 via-slate-900 to-zinc-950';
    }
  };

  // Determine dynamic gradient background based on the snapped active city weather
  const getActiveCityWeatherCodeAndTime = () => {
    const activeCity = carouselCities[activeCarouselIndex] || selectedCity;
    const activeWeather = isSameCity(activeCity, selectedCity)
      ? weatherData ?? savedCitiesWeather[activeCity.id]
      : savedCitiesWeather[activeCity.id];
    if (!activeWeather) return { code: 0, time: undefined };
    return { code: activeWeather.current.weather_code, time: activeWeather.current.time };
  };

  const activeWeatherInfo = getActiveCityWeatherCodeAndTime();
  const dynamicBgGradient = getGradientClasses(activeWeatherInfo.code, activeWeatherInfo.time, false);

  // Toggle Save City Helper
  const handleSaveToggle = (city: City) => {
    const isAlreadySaved = savedCities.some((savedCity) => isSameCity(savedCity, city));

    if (isAlreadySaved) {
      const filtered = savedCities.filter((savedCity) => !isSameCity(savedCity, city));
      updateSavedCities(filtered);
    } else {
      updateSavedCities([...savedCities, city]);
    }
  };

  // Slices 16 hours forecast
  const getHourlyForecast = (data: WeatherData) => {
    const currentTime = data.current.time;
    let index = data.hourly.time.findIndex((t) => t >= currentTime);
    if (index === -1) index = 0;

    const sliced = [];
    const forecastLength = Math.min(
      data.hourly.time.length,
      data.hourly.temperature_2m.length,
      data.hourly.precipitation_probability.length,
      data.hourly.weather_code.length
    );

    for (let i = index; i < index + 16 && i < forecastLength; i++) {
      sliced.push({
        time: data.hourly.time[i],
        temp: data.hourly.temperature_2m[i],
        pop: data.hourly.precipitation_probability[i],
        code: data.hourly.weather_code[i]
      });
    }
    return sliced;
  };

  // Time format helper
  const formatHourString = (isoString: string) => {
    const parts = isoString.split('T');
    if (parts.length < 2) return isoString;
    const hourPart = parseInt(parts[1].split(':')[0], 10);
    if (Number.isNaN(hourPart)) return isoString;
    const ampm = hourPart >= 12 ? 'PM' : 'AM';
    const hour12 = hourPart % 12 === 0 ? 12 : hourPart % 12;
    return `${hour12} ${ampm}`;
  };

  const formatDayName = (dateString: string, index: number) => {
    if (index === 0) return 'Today';
    const date = new Date(dateString + 'T00:00:00');
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  // Modular renderer of full weather card stack
  const renderWeatherContent = (city: City, data: WeatherData | null, isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-6 animate-pulse select-none">
          <div className="md:col-span-12 text-center flex flex-col items-center gap-3">
            <div className="h-9 w-48 bg-white/10 rounded-full" />
            <div className="h-24 w-36 bg-white/10 rounded-3xl mt-2" />
            <div className="h-5 w-32 bg-white/10 rounded-full" />
            <div className="h-4 w-52 bg-white/10 rounded-full" />
            <div className="h-4 w-24 bg-white/10 rounded-full" />
          </div>
          <div className="md:col-span-12 h-28 bg-white/5 border border-white/10 rounded-3xl" />
          <div className="md:col-span-12 h-36 bg-white/5 border border-white/10 rounded-3xl" />
          <div className="md:col-span-7 h-[420px] bg-white/5 border border-white/10 rounded-3xl" />
          <div className="md:col-span-5 flex flex-col gap-4">
            <div className="h-32 bg-white/5 border border-white/10 rounded-3xl" />
            <div className="h-32 bg-white/5 border border-white/10 rounded-3xl" />
            <div className="h-32 bg-white/5 border border-white/10 rounded-3xl" />
          </div>
        </div>
      );
    }

    if (!data) return null;

    const condition = getWeatherCondition(data.current.weather_code);
    const pop = data.daily.precipitation_probability_max[0];
    const byline = getByline({
      weatherCode: data.current.weather_code,
      temp: data.current.temperature_2m,
      feelsLike: data.current.apparent_temperature,
      pop: pop,
      windSpeed: data.current.wind_speed_10m,
      hour: parseInt(data.current.time.split('T')[1]?.split(':')[0] ?? '12', 10)
    }, humorMode);

    const isSaved = savedCities.some((savedCity) => isSameCity(savedCity, city));

    // Get Umbrella Recommendation Styles
    const getUmbrellaStyles = (status: 'yes' | 'maybe' | 'no') => {
      switch (status) {
        case 'yes':
          return { text: 'text-rose-400', border: 'border-rose-500/30 bg-rose-950/30 backdrop-blur-md', cardBorder: 'border-rose-500/25', label: 'Umbrella Needed' };
        case 'maybe':
          return { text: 'text-amber-400', border: 'border-amber-500/30 bg-amber-950/30 backdrop-blur-md', cardBorder: 'border-amber-500/25', label: 'Umbrella Maybe' };
        case 'no':
        default:
          return { text: 'text-emerald-400', border: 'border-emerald-500/30 bg-emerald-950/30 backdrop-blur-md', cardBorder: 'border-emerald-500/20', label: 'No Umbrella Needed' };
      }
    };
    const umbrellaRecommendation = getUmbrellaRecommendation(data);
    const umbrellaBadge = getUmbrellaStyles(umbrellaRecommendation.status);

    const hourly = getHourlyForecast(data);

    const weekMin = Math.min(...data.daily.temperature_2m_min);
    const weekMax = Math.max(...data.daily.temperature_2m_max);
    const weekRange = weekMax - weekMin;

    // Advice strings for details
    const feelsLikeDiff = Math.abs(data.current.temperature_2m - data.current.apparent_temperature);
    const statsAdvice = feelsLikeDiff > 3 
      ? (data.current.apparent_temperature < data.current.temperature_2m ? 'Wind makes it feel colder.' : 'Humidity makes it feel warmer.')
      : 'Similar to the actual temp.';

    const windAdvice = data.current.wind_speed_10m < 10 
      ? 'Light, gentle breeze.'
      : (data.current.wind_speed_10m < 25 ? 'Moderate breeze blowing.' : 'Strong winds. Hold tight!');

    const precipAdvice = data.current.precipitation === 0 
      ? 'No rain expected currently.'
      : (data.current.precipitation < 2 ? 'Light drizzle falling.' : 'Steady rain in progress.');

    return (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-4">
        {/* Core Header Displays */}
        <section className="md:col-span-12 text-center py-6 select-none flex flex-col items-center">
          <h2 className="text-3xl font-light text-white tracking-wide">{city.name}</h2>
          
          <div className="relative flex justify-center items-start mt-2">
            <span className="text-8xl md:text-9xl font-extralight tracking-tighter text-white leading-none">
              {Math.round(convertTemp(data.current.temperature_2m))}
            </span>
            <span className="text-4xl font-light text-white/70 ml-1 mt-1">°</span>
          </div>
          
          <p className="text-lg font-medium text-white/95 mt-2">
            {condition.description}
          </p>

          {byline && (
            <p className="text-xs text-white/60 mt-2 max-w-sm mx-auto leading-relaxed font-normal">
              {byline}
            </p>
          )}
          
          <div className="flex items-center gap-3 text-sm font-semibold text-white/75 mt-2">
            <span>H:{Math.round(convertTemp(data.daily.temperature_2m_max[0]))}°</span>
            <span>L:{Math.round(convertTemp(data.daily.temperature_2m_min[0]))}°</span>
          </div>

          {/* Sub-header actions */}
          <div className="flex flex-wrap justify-center items-center gap-2.5 mt-5">
            <div className={`px-3.5 py-1 rounded-full border text-[10px] font-bold tracking-widest uppercase shadow-md ${umbrellaBadge.border} ${umbrellaBadge.text}`}>
              ☔ {umbrellaBadge.label}
            </div>
            
            <button
              type="button"
              aria-label={isSaved ? `Remove ${getCityLabel(city)} from saved cities` : `Save ${getCityLabel(city)}`}
              onClick={() => handleSaveToggle(city)}
              className={`px-3.5 py-1 rounded-full border text-[10px] font-bold tracking-widest uppercase backdrop-blur-xl shadow-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ${
                isSaved
                  ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/35'
                  : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white'
              }`}
            >
              {isSaved ? '✓ Saved' : '+ Add City'}
            </button>
          </div>
        </section>

        {/* UMBRELLA ADVICE CARD */}
        <section className={`md:col-span-12 bg-white/5 border ${umbrellaBadge.cardBorder} backdrop-blur-md rounded-3xl p-5 shadow-lg flex gap-4 items-start transition-colors`}>
          <div className={`p-2.5 rounded-2xl bg-white/5 border border-white/10 flex-shrink-0 ${umbrellaBadge.text}`}>
            <WeatherIcon name="umbrella" className="w-5 h-5 fill-current/10" />
          </div>
          <div className="flex-1">
            <h3 className="text-[10px] font-bold text-white/35 tracking-widest uppercase">Umbrella Verdict</h3>
            <p className="text-base font-semibold text-white mt-1">
              {umbrellaRecommendation.status === 'yes'
                ? 'Bring an umbrella.'
                : umbrellaRecommendation.status === 'maybe'
                ? 'An umbrella wouldn\'t hurt.'
                : 'No umbrella needed.'}
            </p>
            <p className="text-xs text-white/60 mt-1.5 leading-relaxed font-normal">
              {umbrellaRecommendation.advice}
            </p>
          </div>
        </section>

        {/* HOURLY FORECAST CARD */}
        <section className="md:col-span-12 bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-5 shadow-lg hover:border-white/15 transition-colors">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/35 tracking-widest uppercase border-b border-white/10 pb-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Hourly Forecast
          </div>

          <div className="flex gap-4 overflow-x-auto pb-1 pt-1.5 no-scrollbar px-1">
            {hourly.map((h, i) => {
              const hCond = getWeatherCondition(h.code);
              return (
                <div
                  key={h.time}
                  className="flex-shrink-0 w-12 flex flex-col items-center text-center justify-between gap-3 select-none py-1 rounded-2xl hover:bg-white/5 transition-all duration-300"
                >
                  <span className="text-xs font-semibold text-white/50">
                    {i === 0 ? 'Now' : formatHourString(h.time).split(' ')[0]}
                  </span>
                  
                  <div className="flex flex-col items-center gap-1.5 min-h-[44px] justify-center">
                    <WeatherIcon name={hCond.iconName} className="w-6 h-6 flex-shrink-0" />
                    {h.pop > 0 && (
                      <span className="text-[9px] font-bold text-sky-400">
                        {h.pop}%
                      </span>
                    )}
                  </div>

                  <span className="text-sm font-semibold text-white mt-1">
                    {Math.round(convertTemp(h.temp))}°
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* 7-DAY FORECAST CARD */}
        <section className="md:col-span-7 bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-5 shadow-lg hover:border-white/15 transition-colors">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/35 tracking-widest uppercase border-b border-white/10 pb-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            7-Day Forecast
          </div>

          <div className="flex flex-col divide-y divide-white/5">
            {data.daily.time.map((day, idx) => {
              const dayCond = getWeatherCondition(data.daily.weather_code[idx]);
              const minTemp = data.daily.temperature_2m_min[idx];
              const maxTemp = data.daily.temperature_2m_max[idx];
              const popDaily = data.daily.precipitation_probability_max[idx];
              const barLeft = weekRange > 0 ? ((minTemp - weekMin) / weekRange) * 100 : 10;
              const barRight = weekRange > 0 ? ((weekMax - maxTemp) / weekRange) * 100 : 10;
              return (
                <div
                  key={day}
                  className="flex items-center justify-between py-3.5 first:pt-1 last:pb-1"
                >
                  <span className="text-sm font-medium text-white w-20">
                    {formatDayName(day, idx)}
                  </span>

                  <div className="flex items-center gap-2 w-14 justify-start">
                    <WeatherIcon name={dayCond.iconName} className="w-5 h-5 flex-shrink-0" />
                    {popDaily > 0 && (
                      <span className="text-[9px] font-bold text-sky-400">
                        {popDaily}%
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 text-xs font-semibold w-36 justify-end">
                    <span className="text-white/40 text-sm font-semibold w-8 text-right">
                      {Math.round(convertTemp(minTemp))}°
                    </span>
                    
                    <div className="w-20 h-1.5 bg-white/10 rounded-full relative overflow-hidden flex-shrink-0">
                      <div
                        className="absolute h-full bg-white/40 rounded-full"
                        style={{ left: `${barLeft.toFixed(1)}%`, right: `${barRight.toFixed(1)}%` }}
                      />
                    </div>

                    <span className="text-white text-sm font-semibold w-8 text-right">
                      {Math.round(convertTemp(maxTemp))}°
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* STATS DETAIL GRID */}
        <section className="md:col-span-5 grid grid-cols-3 md:grid-cols-1 gap-4">
          {/* Feels Like */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-4 flex flex-col justify-between h-32 shadow-lg hover:border-white/15 transition-all">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/35 tracking-widest uppercase">
              <WeatherIcon name="temp" className="w-3.5 h-3.5 text-white/35" />
              Feels Like
            </div>
            <div className="my-1">
              <span className="text-2xl font-semibold text-white tracking-tight">
                {Math.round(convertTemp(data.current.apparent_temperature))}°
              </span>
            </div>
            <p className="text-[10px] text-white/50 leading-relaxed font-normal">{statsAdvice}</p>
          </div>

          {/* Wind */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-4 flex flex-col justify-between h-32 shadow-lg hover:border-white/15 transition-all">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/35 tracking-widest uppercase">
              <WeatherIcon name="wind" className="w-3.5 h-3.5 text-white/35" />
              Wind
            </div>
            <div className="my-1">
              <span className="text-2xl font-semibold text-white tracking-tight">
                {Math.round(data.current.wind_speed_10m)}
              </span>
              <span className="text-xs text-white/60 ml-1 font-medium">km/h</span>
            </div>
            <p className="text-[10px] text-white/50 leading-relaxed font-normal">{windAdvice}</p>
          </div>

          {/* Precipitation */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-4 flex flex-col justify-between h-32 shadow-lg hover:border-white/15 transition-all">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/35 tracking-widest uppercase">
              <WeatherIcon name="precipitation" className="w-3.5 h-3.5 text-white/35" />
              Precipitation
            </div>
            <div className="my-1">
              <span className="text-2xl font-semibold text-white tracking-tight">
                {data.current.precipitation}
              </span>
              <span className="text-xs text-white/60 ml-1 font-medium">mm</span>
            </div>
            <p className="text-[10px] text-white/50 leading-relaxed font-normal">{precipAdvice}</p>
          </div>
        </section>
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b ${dynamicBgGradient} text-white font-sans transition-all duration-1000 pb-16 selection:bg-white/10`}>
      {/* Search Header Bar (Sticky at Top) */}
      <header className="sticky top-0 z-50 w-full max-w-xl md:max-w-4xl mx-auto px-4 md:px-0 pt-6 pb-2 bg-slate-950/85 backdrop-blur-xl border-b border-white/5">
        <div className="flex flex-col gap-4 w-full">
          {/* Logo / Header Branding */}
          <div className="flex items-center justify-between px-1 select-none">
            <div className="flex items-center gap-2">
              <span className="text-xl font-light tracking-wide text-white/90">
                Umbrella <span className="font-semibold text-sky-400">Maybe</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                ref={settingsButtonRef}
                type="button"
                onClick={() => setShowSettings(true)}
                aria-label="Open settings"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/15 transition-all text-white/70 hover:text-white cursor-pointer active:scale-95 animate-fade-in"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
              <span className="text-[10px] font-bold text-white/35 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full uppercase tracking-wider select-none">
                v1.0
              </span>
            </div>
          </div>

          <div ref={searchContainerRef} className="relative w-full">
            <div className="relative">
              <label htmlFor="city-search" className="sr-only">
                Search for a city or airport
              </label>
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                {searchLoading ? (
                  <WeatherIcon name="spinner" className="w-4 h-4 animate-spin text-white/50" />
                ) : (
                  <WeatherIcon name="search" className="w-4.5 h-4.5 text-white/50" />
                )}
              </span>
              <input
                id="city-search"
                type="text"
                placeholder="Search for a city or airport"
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  if (val.trim().length < 2) {
                    setSearchResults([]);
                    setSearchError(null);
                    setSearchLoading(false);
                    setShowResults(false);
                  } else {
                    setSearchError(null);
                    setSearchLoading(true);
                    setShowResults(true);
                  }
                }}
                onFocus={() => setShowResults(true)}
                onKeyDown={handleSearchKeyDown}
                role="combobox"
                aria-autocomplete="list"
                aria-controls="city-search-results"
                aria-expanded={showResults}
                aria-busy={searchLoading}
                className="w-full bg-white/5 border border-white/10 hover:border-white/15 focus:border-white/20 focus:bg-white/8 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/45 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all backdrop-blur-xl shadow-lg"
              />
            </div>

            {/* Search Dropdown Results */}
            {showResults && (searchLoading || searchResults.length > 0 || searchError || (searchQuery.trim().length >= 2 && !searchLoading)) && (
              <div id="city-search-results" className="absolute top-full left-0 right-0 mt-2 bg-slate-950/85 border border-white/10 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50 backdrop-blur-3xl">
                {searchLoading && (
                  <div className="p-4 text-xs font-medium text-white/40">Searching...</div>
                )}
                {searchError && (
                  <div className="p-4 text-xs font-semibold text-rose-400">{searchError}</div>
                )}
                {!searchLoading && !searchError && searchResults.length === 0 && (
                  <div className="p-4 text-xs font-medium text-white/40">No results found.</div>
                )}
                {!searchLoading && !searchError && searchResults.length > 0 && (
                  <ul className="divide-y divide-white/5 max-h-60 overflow-y-auto no-scrollbar">
                    {searchResults.map((city) => (
                      <li key={`${city.id}-${city.latitude}`}>
                        <button
                          type="button"
                          aria-label={`Select ${getCityLabel(city)}`}
                          onClick={() => {
                            selectNewCity(city);
                            setSearchQuery('');
                            setSearchResults([]);
                            setSearchLoading(false);
                            setShowResults(false);
                          }}
                          className="w-full min-h-12 text-left px-5 py-3 hover:bg-white/10 transition-colors flex items-center justify-between text-sm font-medium"
                        >
                          <div>
                            <span className="text-white">{city.name}</span>
                            {city.admin1 && (
                              <span className="text-white/40 text-xs ml-2 font-normal">
                                {city.admin1}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-white/50 bg-white/5 px-2 py-0.5 rounded border border-white/10 uppercase font-medium">
                            {city.country_code}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Core Dashboard Carousel */}
      <main className="w-full max-w-xl md:max-w-4xl mx-auto flex flex-col gap-6 relative z-10 mt-2">
        {weatherError && !weatherData && (
          <div className="mx-4 mt-6 bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-8 text-center shadow-xl">
            <p className="text-sm text-white/70 mb-4">{weatherError}</p>
            <button
              type="button"
              aria-label={`Retry weather for ${getCityLabel(selectedCity)}`}
              onClick={() => selectNewCity({ ...selectedCity })}
              className="bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold px-5 py-2.5 rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              Retry
            </button>
          </div>
        )}

        {!weatherError && (
          <>
            {/* Horizontal Swipe Scrollable Container */}
            <div
              ref={carouselRef}
              onScroll={handleCarouselScroll}
              className="w-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
            >
              {carouselCities.map((city, idx) => {
                const isSelected = isSameCity(city, selectedCity);
                const data = isSelected ? (weatherData ?? savedCitiesWeather[city.id]) : savedCitiesWeather[city.id];
                const isLoading = isSelected ? (weatherLoading && !data) : !data;

                return (
                  <div
                    key={`${city.id}-${city.latitude}-${idx}`}
                    className="w-full shrink-0 snap-start snap-always px-4 md:px-0"
                  >
                    {renderWeatherContent(city, data || null, isLoading)}
                  </div>
                );
              })}
            </div>

            {/* Pagination Dots Indicator */}
            {carouselCities.length > 1 && (
              <div className="flex justify-center items-center gap-1.5 py-2 select-none">
                {carouselCities.map((city, idx) => (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Show ${getCityLabel(city)}`}
                    onClick={() => scrollToCity(idx)}
                    className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/5"
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                        idx === activeCarouselIndex ? 'bg-white scale-125' : 'bg-white/30'
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* STATIC BOTTOM SAVED LOCATIONS LIST */}
        {savedCities.length > 0 && (
          <section className="mt-4 mx-4 md:mx-0 flex flex-col gap-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/35 tracking-widest uppercase border-b border-white/10 pb-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5 text-white/35">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              Saved Locations
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedCities.map((city) => {
                const weather = savedCitiesWeather[city.id];
                const isCurrentSelected = isSameCity(selectedCity, city);
                
                const condition = weather ? getWeatherCondition(weather.current.weather_code) : null;
                const cardBgGradient = weather 
                  ? getGradientClasses(weather.current.weather_code, weather.current.time, true)
                  : 'bg-white/5 border-white/10';
                
                const pop = weather ? weather.daily.precipitation_probability_max[0] : 0;
                const cityByline = weather ? getByline({
                  weatherCode: weather.current.weather_code,
                  temp: weather.current.temperature_2m,
                  feelsLike: weather.current.apparent_temperature,
                  pop: pop,
                  windSpeed: weather.current.wind_speed_10m,
                  hour: parseInt(weather.current.time.split('T')[1]?.split(':')[0] ?? '12', 10)
                }, humorMode) : '';

                return (
                  <div
                    key={`${city.id}-${city.latitude}`}
                    className={`group relative overflow-hidden rounded-3xl border shadow-lg backdrop-blur-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-stretch cursor-pointer bg-gradient-to-b ${cardBgGradient} ${
                      isCurrentSelected ? 'ring-1 ring-white/30 border-white/20' : 'border-white/10'
                    }`}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />

                    <button
                      type="button"
                      aria-label={`Show weather for ${getCityLabel(city)}`}
                      onClick={() => selectNewCity(city)}
                      className="z-10 flex flex-1 min-w-0 items-center justify-between gap-4 p-5 pr-2 text-left"
                    >
                      {/* Left: City details & Byline */}
                      <span className="flex flex-col gap-1 flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-white/55 tracking-wider uppercase truncate">
                          {city.admin1 || city.country}
                        </span>
                        <span className="text-xl font-bold text-white tracking-tight truncate leading-tight">
                          {city.name}
                        </span>
                        {weather && (
                          <span className="text-[10px] text-white/60 italic mt-1.5 line-clamp-1 font-normal">
                            {cityByline}
                          </span>
                        )}
                      </span>

                      {/* Right: Weather icon and temp */}
                      <span className="flex items-center gap-3.5 flex-shrink-0">
                        {weather ? (
                          <>
                            <span className="flex flex-col items-end">
                              <span className="text-3xl font-extrabold text-white tracking-tighter">
                                {Math.round(convertTemp(weather.current.temperature_2m))}°
                              </span>
                              <span className="text-[10px] text-white/50 font-semibold mt-0.5">
                                H:{Math.round(convertTemp(weather.daily.temperature_2m_max[0]))}° L:{Math.round(convertTemp(weather.daily.temperature_2m_min[0]))}°
                              </span>
                            </span>
                            <WeatherIcon name={condition?.iconName || 'partly-cloudy'} className="w-9 h-9 flex-shrink-0" />
                          </>
                        ) : (
                          <span className="w-16 h-8 bg-white/5 rounded-xl animate-pulse" />
                        )}
                      </span>
                    </button>

                    <div className="z-10 flex items-center pr-5">
                      <button
                        type="button"
                        aria-label={`Remove ${getCityLabel(city)} from saved locations`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const filtered = savedCities.filter((savedCity) => !isSameCity(savedCity, city));
                          updateSavedCities(filtered);
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 border border-white/10 hover:bg-rose-500/25 hover:border-rose-500/35 hover:text-rose-400 text-white/40 transition-all shadow-inner active:scale-90"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* Settings Modal Overlay */}
      {showSettings && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity duration-300 animate-fade-in"
          onClick={() => setShowSettings(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
        >
          {/* Modal Card */}
          <div
            ref={settingsModalRef}
            className="w-full max-w-md bg-slate-900/90 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl transition-all scale-100 flex flex-col gap-6"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleSettingsModalKeyDown}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 id="settings-title" className="text-lg font-semibold text-white tracking-wide">Settings</h2>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                aria-label="Close settings"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/15 transition-all text-white/70 hover:text-white cursor-pointer active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Temperature Unit selection */}
            <div className="flex flex-col gap-2.5">
              <h3 className="text-xs font-bold text-white/35 tracking-widest uppercase">Temperature Unit</h3>
              <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-2xl border border-white/5">
                <button
                  type="button"
                  onClick={() => updateTempUnit('celsius')}
                  className={`py-2 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    tempUnit === 'celsius'
                      ? 'bg-white/10 text-white shadow'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  Celsius (°C)
                </button>
                <button
                  type="button"
                  onClick={() => updateTempUnit('fahrenheit')}
                  className={`py-2 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    tempUnit === 'fahrenheit'
                      ? 'bg-white/10 text-white shadow'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  Fahrenheit (°F)
                </button>
              </div>
            </div>

            {/* Humor Mode selection */}
            <div className="flex flex-col gap-2.5">
              <h3 className="text-xs font-bold text-white/35 tracking-widest uppercase">Humor Tone Mode</h3>
              <div className="flex flex-col gap-2">
                {[
                  {
                    id: 'light',
                    label: 'Light',
                    desc: 'Polite, friendly, and soft suggestions.'
                  },
                  {
                    id: 'default',
                    label: 'Default',
                    desc: 'Sarcastic, conversational, and direct.'
                  },
                  {
                    id: 'high',
                    label: 'High',
                    desc: 'Dramatic, hyper-expressive, skies plotting violence.'
                  },
                  {
                    id: 'roast',
                    label: 'Roast',
                    desc: 'Pure mockery, questioning your life choices.'
                  }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => updateHumorMode(mode.id as HumorMode)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-0.5 ${
                      humorMode === mode.id
                        ? 'bg-white/10 border-white/20 text-white'
                        : 'bg-white/5 border-white/5 hover:bg-white/8 hover:border-white/10 text-white/70'
                    }`}
                  >
                    <span className="text-sm font-semibold">{mode.label}</span>
                    <span className="text-xs text-white/40 font-normal leading-normal">{mode.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
