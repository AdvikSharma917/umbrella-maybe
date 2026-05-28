'use client';

import React, { useState, useEffect, useRef } from 'react';
import { City, WeatherData, searchCities, fetchWeather } from '@/lib/api';
import { getWeatherCondition, WeatherCondition } from '@/lib/weatherCodes';
import { getByline } from '@/lib/bylineEngine';
import WeatherIcon from '@/components/WeatherIcon';

// Default to London, the home of "Umbrella Maybe" weather
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
  const [savedCitiesWeather, setSavedCitiesWeather] = useState<
    Record<
      number,
      {
        temp: number;
        description: string;
        iconName: string;
        code: number;
        time: string;
        high: number;
        low: number;
        byline: string;
      }
    >
  >({});

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Hydration safety
  useEffect(() => {
    setMounted(true);
    // Load saved cities from localStorage on client side mount
    const saved = localStorage.getItem('umbrella_maybe_saved_cities');
    if (saved) {
      try {
        setSavedCities(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved cities', e);
      }
    }
  }, []);

  // Sync saved cities to localStorage
  const updateSavedCities = (newCities: City[]) => {
    setSavedCities(newCities);
    localStorage.setItem('umbrella_maybe_saved_cities', JSON.stringify(newCities));
  };

  // Asynchronously fetch weather for all saved cities in parallel
  useEffect(() => {
    let active = true;

    async function fetchAllSavedWeather() {
      const weatherMap: typeof savedCitiesWeather = {};
      
      await Promise.all(
        savedCities.map(async (city) => {
          try {
            const data = await fetchWeather(city.latitude, city.longitude);
            const condition = getWeatherCondition(data.current.weather_code);
            const pop = data.daily.precipitation_probability_max[0];
            
            const cityByline = getByline({
              weatherCode: data.current.weather_code,
              temp: data.current.temperature_2m,
              feelsLike: data.current.apparent_temperature,
              pop: pop,
              windSpeed: data.current.wind_speed_10m
            }, 'default');

            weatherMap[city.id] = {
              temp: data.current.temperature_2m,
              description: condition.description,
              iconName: condition.iconName,
              code: data.current.weather_code,
              time: data.current.time,
              high: data.daily.temperature_2m_max[0],
              low: data.daily.temperature_2m_min[0],
              byline: cityByline
            };
          } catch (err) {
            console.error(`Failed to fetch weather for saved city: ${city.name}`, err);
          }
        })
      );

      if (active) {
        setSavedCitiesWeather(weatherMap);
      }
    }

    if (savedCities.length > 0) {
      fetchAllSavedWeather();
    }
  }, [savedCities]);

  const handleSaveCity = () => {
    const isAlreadySaved = savedCities.some(
      (c) =>
        c.id === selectedCity.id ||
        (Math.abs(c.latitude - selectedCity.latitude) < 0.01 &&
          Math.abs(c.longitude - selectedCity.longitude) < 0.01)
    );

    if (isAlreadySaved) {
      const filtered = savedCities.filter(
        (c) =>
          c.id !== selectedCity.id &&
          (Math.abs(c.latitude - selectedCity.latitude) >= 0.01 ||
            Math.abs(c.longitude - selectedCity.longitude) >= 0.01)
      );
      updateSavedCities(filtered);
    } else {
      updateSavedCities([...savedCities, selectedCity]);
    }
  };

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

  // Debounced search logic for Geocoding API
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(null);
      try {
        const results = await searchCities(searchQuery);
        setSearchResults(results);
        setShowResults(true);
      } catch (err) {
        setSearchError('Could not find cities.');
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load weather when selectedCity changes
  useEffect(() => {
    let active = true;

    async function loadWeather() {
      setWeatherLoading(true);
      setWeatherError(null);
      try {
        const data = await fetchWeather(selectedCity.latitude, selectedCity.longitude);
        if (active) {
          setWeatherData(data);
        }
      } catch (err) {
        if (active) {
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
    };
  }, [selectedCity]);

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

  // Get index matching current hour to slice the next 16 hours
  const getHourlyForecast = () => {
    if (!weatherData) return [];
    const currentTime = weatherData.current.time;
    let index = weatherData.hourly.time.findIndex((t) => t >= currentTime);
    if (index === -1) index = 0;

    const sliced = [];
    for (let i = index; i < index + 16 && i < weatherData.hourly.time.length; i++) {
      sliced.push({
        time: weatherData.hourly.time[i],
        temp: weatherData.hourly.temperature_2m[i],
        pop: weatherData.hourly.precipitation_probability[i],
        code: weatherData.hourly.weather_code[i]
      });
    }
    return sliced;
  };

  const hourlyForecast = getHourlyForecast();
  const currentCondition: WeatherCondition = weatherData
    ? getWeatherCondition(weatherData.current.weather_code)
    : getWeatherCondition(0);

  const byline = weatherData
    ? getByline(
        {
          weatherCode: weatherData.current.weather_code,
          temp: weatherData.current.temperature_2m,
          feelsLike: weatherData.current.apparent_temperature,
          pop: weatherData.daily.precipitation_probability_max[0],
          windSpeed: weatherData.current.wind_speed_10m
        },
        'default'
      )
    : '';

  // Time format helper
  const formatHourString = (isoString: string) => {
    const parts = isoString.split('T');
    if (parts.length < 2) return isoString;
    const hourPart = parseInt(parts[1].split(':')[0], 10);
    const ampm = hourPart >= 12 ? 'PM' : 'AM';
    const hour12 = hourPart % 12 === 0 ? 12 : hourPart % 12;
    return `${hour12} ${ampm}`;
  };

  // Weather-based gradient background logic (for pages and cards)
  const getGradientClasses = (weatherCode: number, timeStr?: string, isCard: boolean = false) => {
    // 1. Check Night state (before 6 AM or after 8 PM)
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
        ? 'from-slate-950/80 via-slate-900/60 to-indigo-950/40 border-white/5'
        : 'from-slate-950 via-slate-900 to-zinc-950';
    }

    // 2. Day weather types
    const condition = getWeatherCondition(weatherCode);
    switch (condition.iconName) {
      case 'sunny':
        // sunny = blue/gold
        return isCard
          ? 'from-sky-500/25 via-blue-600/15 to-indigo-950/40 border-sky-500/20'
          : 'from-sky-500 via-blue-600 to-indigo-950';
      case 'partly-cloudy':
      case 'cloudy':
        // cloudy = gray/blue
        return isCard
          ? 'from-slate-500/25 via-slate-700/15 to-zinc-950/40 border-slate-500/20'
          : 'from-slate-500 via-slate-700 to-zinc-950';
      case 'foggy':
        return isCard
          ? 'from-zinc-600/25 via-slate-700/15 to-zinc-950/40 border-zinc-500/20'
          : 'from-zinc-600 via-slate-700 to-zinc-950';
      case 'drizzle':
      case 'rainy':
        // rain = dark blue
        return isCard
          ? 'from-blue-900/35 via-slate-900/25 to-zinc-950/40 border-blue-500/20'
          : 'from-blue-900 via-slate-900 to-zinc-950';
      case 'snowy':
        // snow = pale blue/white
        return isCard
          ? 'from-slate-800/25 via-slate-900/15 to-slate-950/40 border-white/10'
          : 'from-slate-800 via-slate-900 to-slate-950';
      case 'thunderstorm':
        // storm = purple/dark
        return isCard
          ? 'from-purple-950/25 via-indigo-950/20 to-zinc-950/40 border-purple-500/20'
          : 'from-purple-950 via-indigo-950/80 to-zinc-950';
      default:
        return isCard
          ? 'from-slate-900/20 via-slate-950/15 to-black/40 border-white/5'
          : 'from-slate-900 via-slate-950 to-black';
    }
  };

  const dynamicBgGradient = weatherData
    ? getGradientClasses(weatherData.current.weather_code, weatherData.current.time, false)
    : 'from-slate-900 via-slate-950 to-black';

  // Get Umbrella Recommendation visual details
  const getUmbrellaBadgeStyles = (status: 'yes' | 'maybe' | 'no') => {
    switch (status) {
      case 'yes':
        return {
          text: 'text-rose-400',
          border: 'border-rose-500/20 bg-rose-500/5',
          label: 'Umbrella Needed'
        };
      case 'maybe':
        return {
          text: 'text-amber-400',
          border: 'border-amber-500/20 bg-amber-500/5',
          label: 'Umbrella Maybe'
        };
      case 'no':
      default:
        return {
          text: 'text-emerald-400',
          border: 'border-emerald-500/20 bg-emerald-500/5',
          label: 'No Umbrella Needed'
        };
    }
  };

  const umbrellaBadge = getUmbrellaBadgeStyles(currentCondition.umbrella);

  // Date formatting helpers
  const formatDayName = (dateString: string, index: number) => {
    if (index === 0) return 'Today';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const formatStatsAdvice = () => {
    if (!weatherData) return '';
    const temp = weatherData.current.temperature_2m;
    const feels = weatherData.current.apparent_temperature;
    const diff = Math.abs(temp - feels);
    if (diff > 3) {
      return feels < temp ? 'Wind makes it feel colder.' : 'Humidity makes it feel warmer.';
    }
    return 'Similar to the actual temperature.';
  };

  const formatWindAdvice = () => {
    if (!weatherData) return '';
    const speed = weatherData.current.wind_speed_10m;
    if (speed < 10) return 'Light, gentle breeze.';
    if (speed < 25) return 'Moderate breeze blowing.';
    return 'Strong winds. Hold onto your umbrella!';
  };

  const formatPrecipAdvice = () => {
    if (!weatherData) return '';
    const precip = weatherData.current.precipitation;
    if (precip === 0) return 'No rain expected currently.';
    if (precip < 2) return 'Light drizzle falling.';
    return 'Steady rainfall in progress.';
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b ${dynamicBgGradient} text-white font-sans transition-all duration-1000 pb-16 selection:bg-white/10`}>
      {/* Search Header Bar (Sticky at Top) */}
      <header className="sticky top-0 z-50 w-full max-w-lg mx-auto px-4 pt-4 pb-2">
        <div ref={searchContainerRef} className="relative">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {searchLoading ? (
                <WeatherIcon name="spinner" className="w-4 h-4 animate-spin text-white/50" />
              ) : (
                <WeatherIcon name="search" className="w-4 h-4 text-white/50" />
              )}
            </span>
            <input
              type="text"
              placeholder="Search for a city or airport"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              className="w-full bg-slate-900/40 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-100 placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-all backdrop-blur-xl shadow-lg"
            />
          </div>

          {/* Search Dropdown Results */}
          {showResults && (searchResults.length > 0 || searchError || (searchQuery.trim().length >= 2 && !searchLoading)) && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900/85 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-2xl">
              {searchError && (
                <div className="p-3 text-xs text-rose-400">{searchError}</div>
              )}
              {!searchError && searchResults.length === 0 && (
                <div className="p-3 text-xs text-white/40">No results found.</div>
              )}
              {!searchError && searchResults.length > 0 && (
                <ul className="divide-y divide-white/5 max-h-60 overflow-y-auto">
                  {searchResults.map((city) => (
                    <li key={`${city.id}-${city.latitude}`}>
                      <button
                        onClick={() => {
                          setSelectedCity(city);
                          setSearchQuery('');
                          setSearchResults([]);
                          setShowResults(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-white">{city.name}</span>
                          {city.admin1 && (
                            <span className="text-white/40 text-[10px] ml-1.5">
                              {city.admin1}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-white/50 bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase font-medium">
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
      </header>

      {/* Main Core Dashboard Container */}
      <main className="w-full max-w-lg mx-auto px-4 mt-6 flex flex-col gap-6 relative z-10">
        
        {/* Apple Weather Centered Main Display */}
        {weatherLoading ? (
          <div className="text-center py-10 animate-pulse">
            <div className="h-6 w-32 bg-white/10 rounded mx-auto mb-2" />
            <div className="h-20 w-36 bg-white/10 rounded mx-auto mb-2" />
            <div className="h-4 w-40 bg-white/10 rounded mx-auto" />
          </div>
        ) : (
          weatherData && (
            <section className="text-center py-6 select-none flex flex-col items-center">
              <h2 className="text-3xl font-light text-white tracking-wide">{selectedCity.name}</h2>
              
              <div className="flex items-start justify-center mt-1.5 pl-6">
                <span className="text-[5.5rem] font-thin leading-none tracking-tighter text-white">
                  {Math.round(weatherData.current.temperature_2m)}
                </span>
                <span className="text-3xl font-light text-white/70 mt-1">°</span>
              </div>
              
              <p className="text-base font-medium text-white/80 mt-1.5">
                {currentCondition.description}
              </p>

              {/* Funny Byline */}
              {byline && (
                <p className="text-xs text-white/70 italic mt-1 max-w-[280px] mx-auto leading-relaxed">
                  {byline}
                </p>
              )}
              
              <div className="flex items-center gap-3 text-sm font-medium text-white/60 mt-1">
                <span>H:{Math.round(weatherData.daily.temperature_2m_max[0])}°</span>
                <span>L:{Math.round(weatherData.daily.temperature_2m_min[0])}°</span>
              </div>

              {/* Dynamic Sub-header umbrella badge & Save City Toggle */}
              <div className="flex flex-wrap justify-center items-center gap-2 mt-4">
                <div className={`px-3 py-1 rounded-full border text-[11px] font-semibold tracking-wider uppercase ${umbrellaBadge.border} ${umbrellaBadge.text}`}>
                  ☔ {umbrellaBadge.label}
                </div>
                
                <button
                  onClick={handleSaveCity}
                  className={`px-3 py-1 rounded-full border text-[11px] font-semibold tracking-wider uppercase backdrop-blur-xl shadow-md transition-all active:scale-95 ${
                    savedCities.some(c => c.id === selectedCity.id || (Math.abs(c.latitude - selectedCity.latitude) < 0.01 && Math.abs(c.longitude - selectedCity.longitude) < 0.01))
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {savedCities.some(c => c.id === selectedCity.id || (Math.abs(c.latitude - selectedCity.latitude) < 0.01 && Math.abs(c.longitude - selectedCity.longitude) < 0.01))
                    ? '✓ Saved'
                    : '+ Add City'}
                </button>
              </div>
            </section>
          )
        )}

        {weatherError ? (
          <div className="bg-slate-900/35 border border-white/5 backdrop-blur-md rounded-2xl p-6 text-center shadow-lg">
            <p className="text-sm text-white/70 mb-3">{weatherError}</p>
            <button
              onClick={() => setSelectedCity({ ...selectedCity })}
              className="bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          weatherData && (
            <div className="flex flex-col gap-5">
              
              {/* UMBRELLA ADVICE CARD */}
              <section className="bg-slate-900/25 border border-white/5 backdrop-blur-md rounded-2xl p-4.5 shadow-md flex gap-3.5 items-start">
                <div className={`p-2 rounded-xl bg-white/5 border border-white/5 flex-shrink-0 ${umbrellaBadge.text}`}>
                  <WeatherIcon name="umbrella" className="w-5 h-5 fill-current/10" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white/50 tracking-wider uppercase">Umbrella Verdict</h3>
                  <p className="text-sm font-semibold text-white mt-1">
                    {currentCondition.umbrella === 'yes'
                      ? 'Definitely grab an umbrella!'
                      : currentCondition.umbrella === 'maybe'
                      ? 'Umbrella is recommended (just in case)'
                      : 'No need for an umbrella today.'}
                  </p>
                  <p className="text-xs text-white/60 mt-1 leading-relaxed">
                    {currentCondition.advice}
                  </p>
                </div>
              </section>

              {/* HOURLY FORECAST CARD */}
              <section className="bg-slate-900/25 border border-white/5 backdrop-blur-md rounded-2xl p-4 shadow-md">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/40 tracking-wider uppercase border-b border-white/5 pb-2 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Hourly Forecast
                </div>

                <div className="flex gap-4 overflow-x-auto pb-1 pt-1.5 scrollbar-none">
                  {hourlyForecast.map((hour, idx) => {
                    const hourCond = getWeatherCondition(hour.code);
                    return (
                      <div
                        key={hour.time}
                        className="flex-shrink-0 w-11 flex flex-col items-center text-center justify-between gap-2.5 select-none"
                      >
                        <span className="text-[10px] font-medium text-white/50">
                          {idx === 0 ? 'Now' : formatHourString(hour.time).split(' ')[0]}
                        </span>
                        
                        <div className="flex flex-col items-center gap-1 min-h-[40px] justify-center">
                          <WeatherIcon name={hourCond.iconName} className="w-5 h-5 flex-shrink-0" />
                          {hour.pop > 0 && (
                            <span className="text-[8px] font-bold text-sky-400">
                              {hour.pop}%
                            </span>
                          )}
                        </div>

                        <span className="text-xs font-semibold text-white">
                          {Math.round(hour.temp)}°
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* 7-DAY FORECAST CARD */}
              <section className="bg-slate-900/25 border border-white/5 backdrop-blur-md rounded-2xl p-4 shadow-md">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/40 tracking-wider uppercase border-b border-white/5 pb-2 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  7-Day Forecast
                </div>

                <div className="flex flex-col divide-y divide-white/5">
                  {weatherData.daily.time.map((day, idx) => {
                    const dayCond = getWeatherCondition(weatherData.daily.weather_code[idx]);
                    const minTemp = weatherData.daily.temperature_2m_min[idx];
                    const maxTemp = weatherData.daily.temperature_2m_max[idx];
                    const pop = weatherData.daily.precipitation_probability_max[idx];
                    return (
                      <div
                        key={day}
                        className="flex items-center justify-between py-2.5 first:pt-1 last:pb-1"
                      >
                        {/* Day name */}
                        <span className="text-xs font-semibold text-white w-14">
                          {formatDayName(day, idx)}
                        </span>

                        {/* Icon & Pop */}
                        <div className="flex items-center gap-1.5 w-12 justify-center">
                          <WeatherIcon name={dayCond.iconName} className="w-4.5 h-4.5" />
                          {pop > 0 && (
                            <span className="text-[8px] font-bold text-sky-400">
                              {pop}%
                            </span>
                          )}
                        </div>

                        {/* Min / Max Temp range visual track (Apple style) */}
                        <div className="flex items-center gap-2 text-xs font-semibold w-36 justify-end">
                          <span className="text-white/40 text-[11px] w-6 text-right">
                            {Math.round(minTemp)}°
                          </span>
                          
                          {/* Mini slider track */}
                          <div className="w-16 h-1.5 bg-white/10 rounded-full relative overflow-hidden">
                            <div
                              className="absolute h-full bg-gradient-to-r from-sky-400 via-indigo-400 to-amber-400 rounded-full"
                              style={{ left: '15%', right: '15%' }}
                            />
                          </div>

                          <span className="text-white w-6 text-right">
                            {Math.round(maxTemp)}°
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* STATS DETAIL GRID (Feels-like, Wind, Precipitation) */}
              <section className="grid grid-cols-3 gap-3">
                {/* Feels Like Card */}
                <div className="bg-slate-900/25 border border-white/5 backdrop-blur-md rounded-2xl p-3 flex flex-col justify-between h-28 shadow-sm">
                  <div className="flex items-center gap-1 text-[9px] font-bold text-white/40 tracking-wider uppercase">
                    <WeatherIcon name="temp" className="w-3 h-3 text-white/40" />
                    Feels Like
                  </div>
                  <div className="my-1.5">
                    <span className="text-xl font-semibold text-white">
                      {Math.round(weatherData.current.apparent_temperature)}°
                    </span>
                  </div>
                  <p className="text-[9px] text-white/50 leading-tight">
                    {formatStatsAdvice()}
                  </p>
                </div>

                {/* Wind Card */}
                <div className="bg-slate-900/25 border border-white/5 backdrop-blur-md rounded-2xl p-3 flex flex-col justify-between h-28 shadow-sm">
                  <div className="flex items-center gap-1 text-[9px] font-bold text-white/40 tracking-wider uppercase">
                    <WeatherIcon name="wind" className="w-3 h-3 text-white/40" />
                    Wind
                  </div>
                  <div className="my-1.5">
                    <span className="text-xl font-semibold text-white">
                      {Math.round(weatherData.current.wind_speed_10m)}
                    </span>
                    <span className="text-[10px] text-white/60 ml-0.5">km/h</span>
                  </div>
                  <p className="text-[9px] text-white/50 leading-tight">
                    {formatWindAdvice()}
                  </p>
                </div>

                {/* Precipitation Card */}
                <div className="bg-slate-900/25 border border-white/5 backdrop-blur-md rounded-2xl p-3 flex flex-col justify-between h-28 shadow-sm">
                  <div className="flex items-center gap-1 text-[9px] font-bold text-white/40 tracking-wider uppercase">
                    <WeatherIcon name="precipitation" className="w-3 h-3 text-white/40" />
                    Precipitation
                  </div>
                  <div className="my-1.5">
                    <span className="text-xl font-semibold text-white">
                      {weatherData.current.precipitation}
                    </span>
                    <span className="text-[10px] text-white/60 ml-0.5">mm</span>
                  </div>
                  <p className="text-[9px] text-white/50 leading-tight">
                    {formatPrecipAdvice()}
                  </p>
                </div>
              </section>

              {/* SAVED CITIES SECTION */}
              {savedCities.length > 0 && (
                <section className="mt-4 flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/40 tracking-wider uppercase border-b border-white/5 pb-2 mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5 text-white/40">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                    Saved Locations
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    {savedCities.map((city) => {
                      const weather = savedCitiesWeather[city.id];
                      const isCurrentSelected = selectedCity.id === city.id || (Math.abs(selectedCity.latitude - city.latitude) < 0.01 && Math.abs(selectedCity.longitude - city.longitude) < 0.01);
                      
                      // Dynamic background for card based on weather condition
                      const cardBgGradient = weather 
                        ? getGradientClasses(weather.code, weather.time, true)
                        : 'bg-slate-900/25 border-white/5';
                      
                      return (
                        <div
                          key={`${city.id}-${city.latitude}`}
                          onClick={() => {
                            setSelectedCity(city);
                            // Scroll to top
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`group relative overflow-hidden rounded-2xl border p-4 shadow-md backdrop-blur-md cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-between gap-4 ${cardBgGradient} ${
                            isCurrentSelected ? 'ring-1 ring-white/30' : ''
                          }`}
                        >
                          {/* Inner card glow decoration */}
                          <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-xl pointer-events-none" />

                          {/* Left: City details & Byline */}
                          <div className="flex flex-col gap-0.5 z-10 flex-1 min-w-0">
                            <span className="text-xs font-semibold text-white/50 tracking-wider uppercase">
                              {city.admin1 || city.country}
                            </span>
                            <h4 className="text-lg font-bold text-white tracking-tight truncate">
                              {city.name}
                            </h4>
                            {weather && (
                              <p className="text-[10px] text-white/70 italic mt-1 line-clamp-1">
                                {weather.byline}
                              </p>
                            )}
                          </div>

                          {/* Right: Weather icon, Temp, delete button */}
                          <div className="flex items-center gap-4 z-10">
                            {weather ? (
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col items-end">
                                  <span className="text-2xl font-extrabold text-white">
                                    {Math.round(weather.temp)}°
                                  </span>
                                  <span className="text-[9px] text-white/50 font-medium">
                                    H:{Math.round(weather.high)}° L:{Math.round(weather.low)}°
                                  </span>
                                </div>
                                <WeatherIcon name={weather.iconName} className="w-8 h-8 flex-shrink-0" />
                              </div>
                            ) : (
                              <div className="w-12 h-6 bg-white/5 rounded animate-pulse" />
                            )}

                            {/* Remove button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const filtered = savedCities.filter(c => c.id !== city.id);
                                updateSavedCities(filtered);
                              }}
                              className="p-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-rose-500/20 hover:border-rose-500/30 text-white/40 hover:text-rose-400 transition-colors shadow-inner"
                              title="Remove location"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
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

            </div>
          )
        )}
      </main>
    </div>
  );
}
