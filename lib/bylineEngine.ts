export interface BylineInput {
  weatherCode: number;
  temp: number;
  feelsLike: number;
  pop: number; // precipitation probability (0-100)
  windSpeed: number; // wind speed in km/h
}

export type HumorMode = 'light' | 'default' | 'high' | 'roast';

interface BylineSet {
  light: string;
  default: string;
  high: string;
  roast: string;
}

const bylines: Record<string, BylineSet> = {
  highRain: {
    light: 'Rain is highly likely. Make sure to bring an umbrella.',
    default: "It's pouring. Your hair is in immediate danger. Bring an umbrella.",
    high: 'The skies have officially selected violence. Deploy your umbrella immediately.',
    roast: "You're thinking of going out without an umbrella? Damp socks look great on you."
  },
  mediumRain: {
    light: 'Light rain is possible later. Bringing an umbrella is advised.',
    default: 'Umbrella maybe. Those afternoon clouds are looking highly suspicious.',
    high: 'Water droplets are plotting a descent. Pack the umbrella just in case.',
    roast: "A 40% chance of rain means you'll be 100% annoyed if you leave your umbrella."
  },
  highWind: {
    light: 'Strong winds today. Be careful outside.',
    default: 'Extremely windy. Hold onto your hats and watch out for flying debris.',
    high: 'Wind gusts are attempting to permanently reposition your hair. Hang on tight!',
    roast: "It's so windy your umbrella is basically a parachute. Good luck staying grounded."
  },
  veryCold: {
    light: 'Very cold outside. Wear a warm jacket.',
    default: "It's freezing. Don't forget a warm hoodie or a heavy jacket.",
    high: 'Arctic temperatures detected. Wrap yourself in a duvet and stay indoors.',
    roast: "It is freezing. Do you really need to go outside? Your blanket loves you more."
  },
  veryHot: {
    light: 'Hot weather today. Remember to stay hydrated.',
    default: "It's a hot one. Remember to drink water and wear sunscreen.",
    high: 'The sun is acting like it has a personal vendetta. Hydrate or evaporate!',
    roast: "It's hot enough to melt your enthusiasm. Drink water before you turn into a raisin."
  },
  niceWeather: {
    light: 'Clear skies and pleasant temperatures today.',
    default: 'Nice weather ahead. Perfect day to go outside and enjoy the sun!',
    high: 'Absolute gold-tier weather. The birds are singing, the skies are flexing.',
    roast: 'The weather is perfect outside. A great day to touch some actual grass.'
  }
};

/**
 * Returns a rule-based funny byline based on current weather conditions.
 */
export function getByline(input: BylineInput, mode: HumorMode = 'default'): string {
  const { weatherCode, temp, feelsLike, pop, windSpeed } = input;

  // 1. Rule: High Rain Chance (pop >= 70% or rain/storm weather codes)
  const isRainCode = (weatherCode >= 61 && weatherCode <= 67) || 
                     (weatherCode >= 80 && weatherCode <= 82) || 
                     (weatherCode >= 95 && weatherCode <= 99);
  if (pop >= 70 || isRainCode) {
    return bylines.highRain[mode];
  }

  // 2. Rule: Medium Rain Chance (pop >= 30% or drizzle weather codes)
  const isDrizzleCode = (weatherCode >= 51 && weatherCode <= 57);
  if (pop >= 30 || isDrizzleCode) {
    return bylines.mediumRain[mode];
  }

  // 3. Rule: High Wind (wind speed >= 25 km/h)
  if (windSpeed >= 25) {
    return bylines.highWind[mode];
  }

  // 4. Rule: Very Cold (feelsLike <= 8°C)
  if (feelsLike <= 8) {
    return bylines.veryCold[mode];
  }

  // 5. Rule: Very Hot (temp >= 28°C)
  if (temp >= 28) {
    return bylines.veryHot[mode];
  }

  // 6. Rule: Nice Weather (fallback)
  return bylines.niceWeather[mode];
}
