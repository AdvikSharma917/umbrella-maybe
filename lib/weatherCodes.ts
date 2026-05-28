export interface WeatherCondition {
  description: string;
  umbrella: 'yes' | 'maybe' | 'no';
  advice: string;
  iconName: 'sunny' | 'partly-cloudy' | 'cloudy' | 'foggy' | 'drizzle' | 'rainy' | 'thunderstorm' | 'snowy';
}

const weatherConditions: Record<number, WeatherCondition> = {
  0: {
    description: 'Clear Sky',
    umbrella: 'no',
    advice: 'No umbrella needed. Enjoy the clear skies!',
    iconName: 'sunny'
  },
  1: {
    description: 'Mainly Clear',
    umbrella: 'no',
    advice: 'No umbrella needed. Perfect weather to go out!',
    iconName: 'sunny'
  },
  2: {
    description: 'Partly Cloudy',
    umbrella: 'no',
    advice: 'No umbrella needed. A few clouds, but no rain in sight.',
    iconName: 'partly-cloudy'
  },
  3: {
    description: 'Overcast',
    umbrella: 'maybe',
    advice: 'Umbrella maybe. It is fully overcast; rain is possible but not certain.',
    iconName: 'cloudy'
  },
  45: {
    description: 'Foggy',
    umbrella: 'no',
    advice: 'No umbrella needed, but visibility is low. Stay safe!',
    iconName: 'foggy'
  },
  48: {
    description: 'Depositing Rime Fog',
    umbrella: 'no',
    advice: 'No umbrella needed, but watch out for icy, foggy patches.',
    iconName: 'foggy'
  },
  51: {
    description: 'Light Drizzle',
    umbrella: 'maybe',
    advice: 'Umbrella maybe. Very light drizzle, you might get a little damp.',
    iconName: 'drizzle'
  },
  53: {
    description: 'Moderate Drizzle',
    umbrella: 'maybe',
    advice: 'Umbrella maybe. Continuous drizzle; we recommend carrying one.',
    iconName: 'drizzle'
  },
  55: {
    description: 'Dense Drizzle',
    umbrella: 'yes',
    advice: 'Umbrella yes. Thick drizzle is falling, you will get wet quickly.',
    iconName: 'drizzle'
  },
  56: {
    description: 'Light Freezing Drizzle',
    umbrella: 'maybe',
    advice: 'Umbrella maybe. Icy drizzle is falling. Bundle up!',
    iconName: 'drizzle'
  },
  57: {
    description: 'Dense Freezing Drizzle',
    umbrella: 'yes',
    advice: 'Umbrella yes. Heavy freezing drizzle. Watch out for icy surfaces!',
    iconName: 'drizzle'
  },
  61: {
    description: 'Slight Rain',
    umbrella: 'yes',
    advice: 'Umbrella yes. Light rain is falling. Keep dry!',
    iconName: 'rainy'
  },
  63: {
    description: 'Moderate Rain',
    umbrella: 'yes',
    advice: 'Umbrella yes. Steady rain. Do not forget your umbrella!',
    iconName: 'rainy'
  },
  65: {
    description: 'Heavy Rain',
    umbrella: 'yes',
    advice: 'Umbrella yes! Downpour expected. Stay dry and find shelter if needed.',
    iconName: 'rainy'
  },
  66: {
    description: 'Light Freezing Rain',
    umbrella: 'yes',
    advice: 'Umbrella yes. Icy rain is falling. Streets will be slick!',
    iconName: 'rainy'
  },
  67: {
    description: 'Heavy Freezing Rain',
    umbrella: 'yes',
    advice: 'Umbrella yes! Dangerous freezing rain. Better stay indoors.',
    iconName: 'rainy'
  },
  71: {
    description: 'Slight Snowfall',
    umbrella: 'no',
    advice: 'No umbrella needed. Light snow is falling, wear a warm coat!',
    iconName: 'snowy'
  },
  73: {
    description: 'Moderate Snowfall',
    umbrella: 'no',
    advice: 'No umbrella needed. Steady snow. Bundle up and enjoy!',
    iconName: 'snowy'
  },
  75: {
    description: 'Heavy Snowfall',
    umbrella: 'no',
    advice: 'No umbrella needed. Heavy snow storm. Bundle up warm!',
    iconName: 'snowy'
  },
  77: {
    description: 'Snow Grains',
    umbrella: 'no',
    advice: 'No umbrella needed. Tiny ice grains. Wear a hood or hat.',
    iconName: 'snowy'
  },
  80: {
    description: 'Slight Rain Showers',
    umbrella: 'yes',
    advice: 'Umbrella yes. Passing rain showers. Keep your umbrella ready.',
    iconName: 'rainy'
  },
  81: {
    description: 'Moderate Rain Showers',
    umbrella: 'yes',
    advice: 'Umbrella yes. Rain showers. You will definitely want cover.',
    iconName: 'rainy'
  },
  82: {
    description: 'Violent Rain Showers',
    umbrella: 'yes',
    advice: 'Umbrella yes! Intense downpour. An umbrella is highly recommended.',
    iconName: 'rainy'
  },
  85: {
    description: 'Slight Snow Showers',
    umbrella: 'no',
    advice: 'No umbrella needed. Light snow showers. Wear your winter gear.',
    iconName: 'snowy'
  },
  86: {
    description: 'Heavy Snow Showers',
    umbrella: 'no',
    advice: 'No umbrella needed. Sudden heavy snow. Winter coat is a must!',
    iconName: 'snowy'
  },
  95: {
    description: 'Thunderstorm',
    umbrella: 'yes',
    advice: 'Umbrella yes! Thunderstorms. Watch out for lightning and sudden wind.',
    iconName: 'thunderstorm'
  },
  96: {
    description: 'Thunderstorm with Slight Hail',
    umbrella: 'yes',
    advice: 'Umbrella yes! Hail and lightning. Seek shelter immediately.',
    iconName: 'thunderstorm'
  },
  99: {
    description: 'Thunderstorm with Heavy Hail',
    umbrella: 'yes',
    advice: 'Umbrella yes! Severe storm with heavy hail. Stay indoors!',
    iconName: 'thunderstorm'
  }
};

export function getWeatherCondition(code: number): WeatherCondition {
  // Default to partly cloudy if code is unknown
  return weatherConditions[code] || {
    description: 'Unknown Conditions',
    umbrella: 'maybe',
    advice: 'Weather conditions are uncertain. Better safe than sorry!',
    iconName: 'partly-cloudy'
  };
}
