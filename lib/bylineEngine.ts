export interface BylineInput {
  weatherCode: number;
  temp: number;
  feelsLike: number;
  pop: number; // precipitation probability (0-100)
  windSpeed: number; // wind speed in km/h
  hour?: number; // 0-23, local hour for time-of-day variation
}

export type HumorMode = 'light' | 'default' | 'high' | 'roast';

type BylineSet = {
  light: readonly string[];
  default: readonly string[];
  high: readonly string[];
  roast: readonly string[];
};

function pick(arr: readonly string[], seed: number): string {
  return arr[((seed % arr.length) + arr.length) % arr.length];
}

const bylines = {
  heavyRain: {
    light: [
      'Rain is likely and significant. Pack an umbrella.',
      'High chance of rain today. An umbrella is not optional.',
      'Expect rain. The umbrella earns its place today.',
    ],
    default: [
      "It's pouring. Your hair is in immediate danger. Bring an umbrella.",
      'Rain is not hypothetical today. Take the umbrella.',
      'Heavy rain incoming. The clouds have committed.',
      'The forecast is wet and specific. Pack accordingly.',
    ],
    high: [
      'The skies have officially selected violence. Deploy the umbrella.',
      "Rain has scheduled a full-day appearance. Deny it the satisfaction.",
      "Today's precipitation: committed. Your response: umbrella.",
      'The forecast is not subtle. It is raining. Take the umbrella.',
    ],
    roast: [
      "You're thinking of going out without an umbrella? Damp socks look great on you.",
      'Bold of you to leave the umbrella home on a day like this.',
      'Going out without an umbrella today is a choice. A wet, regrettable one.',
      'The rain will find you. The question is whether you planned for it.',
    ],
  } satisfies BylineSet,

  mediumRain: {
    light: [
      'Rain is possible. Worth bringing an umbrella.',
      'Conditions are uncertain. An umbrella is the safe call.',
      'Light rain likely at some point. Pack it just in case.',
    ],
    default: [
      'Umbrella maybe. Those clouds are looking suspicious.',
      'A reasonable chance of rain. Pack the umbrella and hedge your bets.',
      'The clouds are giving mixed signals. Bring something waterproof.',
      'Not certain, but the forecast leans damp. Better safe.',
    ],
    high: [
      'Water droplets are plotting a descent. Pack the umbrella.',
      'The atmosphere is undecided, but leans damp. Plan accordingly.',
      "Rain might show up. It hasn't confirmed, but it's considering it.",
      'Clouds with options. One of them involves your outfit.',
    ],
    roast: [
      "A 40% chance of rain means you'll be 100% annoyed if you left your umbrella.",
      "It might not rain. You'll absolutely remember this decision either way.",
      "Moderate rain probability. High 'I should have packed it' probability.",
      'Leave the umbrella. Find out the hard way. Good for character.',
    ],
  } satisfies BylineSet,

  lightRain: {
    light: [
      'Low rain probability. Conditions are mostly fine.',
      'Small chance of light rain. Probably fine today.',
      'Mostly dry. A light jacket covers the bases.',
    ],
    default: [
      'A sprinkle at most. Probably fine without an umbrella.',
      'Very low rain odds. The umbrella can stay home.',
      'The forecast suggests mostly dry with a brief lapse into damp.',
      'The rain risk is theoretical today. Proceed accordingly.',
    ],
    high: [
      'The rain threat is present but unconvincing. Leave the umbrella.',
      'Clouds present. Rain undecided. Skip the umbrella.',
      "The atmosphere is flirting with rain but hasn't committed.",
      "20% chance of rain is basically the sky keeping its options open.",
    ],
    roast: [
      'Light drizzle at worst. You will survive. Probably.',
      "The forecast barely mentions rain. You're fine. Go outside.",
      'A passing cloud might spit lightly. This is not news.',
      'Low rain probability. This is the forecast telling you to relax.',
    ],
  } satisfies BylineSet,

  snow: {
    light: [
      'Snow expected today. Waterproof boots over an umbrella.',
      'Snowfall on the forecast. Dress in layers.',
      'Snowy conditions ahead. Plan extra travel time.',
    ],
    default: [
      'Snow today. Boots and a coat over an umbrella.',
      'Snowfall expected. The umbrella is not the hero of this story.',
      'It will snow. Adjust your footwear and expectations.',
      'Snow on the forecast. The classic frozen format.',
    ],
    high: [
      'Snow is happening. The umbrella has no role in this.',
      'Precipitation: frozen. Dress accordingly.',
      'Snowfall confirmed. The umbrella stays home; bring the coat.',
      'Nature has selected the aesthetic option today.',
    ],
    roast: [
      "It's going to snow. Your umbrella will be confused. Pack a coat.",
      'Snow. The cold kind. You live somewhere with seasons.',
      "Snow day. Or just a Tuesday, depending on your relationship with winter.",
      'Snowing. You knew what climate you signed up for.',
    ],
  } satisfies BylineSet,

  fog: {
    light: [
      'Foggy conditions today. Allow extra travel time.',
      'Fog on the forecast. Visibility will be limited.',
      'Misty outside. Drive carefully.',
    ],
    default: [
      'Fog rolling in. Not rain, but the atmosphere is doing something.',
      'Foggy morning. The world has opted for mystery today.',
      'Misty conditions. An umbrella is optional; visibility is not.',
      'Fog on the forecast. Drive slowly.',
    ],
    high: [
      'The fog has arrived. Your umbrella is irrelevant; your sense of direction is not.',
      'Visibility: reduced. Atmosphere: suspicious. Proceed with care.',
      'Dense fog. The world is significantly less visible than usual.',
      'Fog: thorough. Plans: proceed with appropriate caution.',
    ],
    roast: [
      "Foggy. Not rain. Your umbrella won't help out there.",
      'Dense fog. Spooky. You asked for weather; this is what weather does.',
      'The fog is thick. Drive slower than you think you need to.',
      "It's fog. Atmospheric conditions. Proceed carefully.",
    ],
  } satisfies BylineSet,

  extremeWind: {
    light: [
      'Dangerous wind speeds today. Secure loose items outside.',
      'Extreme winds forecast. Exercise caution.',
      'Very strong gusts. An umbrella is not advisable today.',
    ],
    default: [
      "Extreme wind. An umbrella here is not a tool; it's a sail.",
      "Gale-force gusts. Your umbrella would prefer not to participate.",
      'Wind speeds are not umbrella-compatible today. Leave it home.',
      'The wind is categorically extreme. A different strategy is warranted.',
    ],
    high: [
      "The wind is in a destructive mood. Your umbrella won't survive contact.",
      'Gale conditions. The umbrella stays home; everything else is negotiable.',
      'Wind at these speeds turns umbrellas into abstract sculptures.',
      'The atmosphere is running on chaos. Your umbrella has no place here.',
    ],
    roast: [
      "That windy. An umbrella becomes someone else's problem two blocks away.",
      'Extreme wind. Bring an umbrella and lose an umbrella.',
      'Wind speed: excessive. Umbrella status: pointless. Have a good one.',
      'The umbrella would leave you before you left the door.',
    ],
  } satisfies BylineSet,

  highWind: {
    light: [
      'Windy today. An umbrella may be difficult to manage.',
      'Strong gusts forecast. Consider a hat over an umbrella.',
      'Gusty conditions. Hold onto whatever you bring.',
    ],
    default: [
      'Gusty today. Hold onto your hat and reconsider the umbrella.',
      'Strong winds on the forecast. An umbrella works, technically.',
      "Windy enough to make an umbrella more trouble than it's worth.",
      'The wind has opinions today. Plan accordingly.',
    ],
    high: [
      'Wind gusts are attempting to permanently reposition your hair.',
      "The wind is in a difficult mood today. The umbrella may not return.",
      'Significant gusts. The umbrella becomes a liability.',
      'The kind of windy that turns carrying an umbrella into a small performance.',
    ],
    roast: [
      'Your umbrella is basically a parachute today. Good luck.',
      'Hold onto anything you value. The wind takes no responsibility.',
      'Wind: strong. Your grip: probably not strong enough.',
      'The umbrella has a better chance of escape than you do.',
    ],
  } satisfies BylineSet,

  extremeCold: {
    light: [
      'Temperatures near or below freezing. Heavy coat essential.',
      'Freezing conditions. Dress in proper layers.',
      'Extremely cold today. Protect your extremities.',
    ],
    default: [
      'Temperatures are below freezing. The umbrella is the least of your concerns.',
      'Below zero. The coat is doing the real work today.',
      'Genuinely freezing. Dress for it before worrying about rain.',
      'Sub-zero temperatures. The cold is the primary concern.',
    ],
    high: [
      'Temperatures below zero. The cold is not theoretical; it is personal.',
      'Arctic conditions. The kind of cold that makes you question your choices.',
      'Below freezing. The weather has moved past difficult into adversarial.',
      'Very cold. Your body will register this immediately.',
    ],
    roast: [
      "Below freezing. If you're still debating warmth, the app has done all it can.",
      'Sub-zero. Great day to stay in. Your umbrella agrees.',
      'Freezing. The blanket has been right about this all along.',
      "It's below zero. You don't need weather advice; you need a better plan.",
    ],
  } satisfies BylineSet,

  veryCold: {
    light: [
      'Cold today. A warm jacket is the right call.',
      'Chilly outside. Layer before heading out.',
      'Apparent temperature is low. Dress accordingly.',
    ],
    default: [
      'Cold enough to matter. Bring a proper coat.',
      'It feels colder than it looks. Layer accordingly.',
      'The feels-like temperature is not to be ignored today.',
      "Cooler than expected once you're out there.",
    ],
    high: [
      'Your body will file a complaint if you leave without a coat.',
      'The apparent temperature has entered unpleasant territory.',
      'Cold outside. The coat earns its place today.',
      'Brisk. The kind that makes thin layers feel like a poor decision.',
    ],
    roast: [
      "Cold enough that you'll wish you'd dressed better within the first three minutes.",
      'It is cold. The blanket has been right about this all along.',
      'Your outfit is underprepared for the current conditions.',
      'Do you really need to go outside? Your blanket loves you more.',
    ],
  } satisfies BylineSet,

  extremeHeat: {
    light: [
      'Extreme heat today. Hydrate and limit direct sun exposure.',
      'Very hot conditions. Sun protection is essential.',
      'High temperatures. Water and shade are the priorities.',
    ],
    default: [
      'Genuinely hot today. Hydrate before you leave, not after.',
      'The temperature is high enough to demand respect. Water and shade.',
      'Extreme heat. Not a day to underestimate the sun.',
      'Hot enough that your body will have notes. Drink water.',
    ],
    high: [
      'The sun has clocked in for overtime and has no intention of leaving.',
      'Temperature: excessive. Advice: water, shade, and lower expectations.',
      'Extremely hot. The sun today is operating beyond its mandate.',
      'The heat is a physical fact, not a vibe. Hydrate accordingly.',
    ],
    roast: [
      "It's hot enough to question every outdoor plan you had. Drink some water.",
      'Extreme heat. Step outside and immediately reconsider.',
      'Dangerously hot. The blanket would never do this to you.',
      'The temperature peaked and kept going. Drink water before you become a problem.',
    ],
  } satisfies BylineSet,

  veryHot: {
    light: [
      'Warm weather today. Stay hydrated and wear sunscreen.',
      'Hot and sunny. Light clothing is the move.',
      'Temperatures climbing. A good day for hydration.',
    ],
    default: [
      'Hot one today. Water and sunscreen, in that order.',
      'Warm and sunny. Dress light and stay hydrated.',
      'The sun is delivering today. Pack accordingly.',
      "A hot day. Nothing you can't handle with water and shade.",
    ],
    high: [
      'The sun is conducting its annual campaign to remind you of its power.',
      'Hot. The kind that makes pavement radiate and good judgment optional.',
      'Temperature is elevated. The sun is not concerned with your plans.',
      'The heat is doing a lot today. Pack water and manage expectations.',
    ],
    roast: [
      "It's hot enough to melt your enthusiasm. Drink water.",
      'The sun has made its position very clear. You are on notice.',
      'Hot today. Your body will communicate this quickly.',
      'The temperature is high. Revise your water intake plan accordingly.',
    ],
  } satisfies BylineSet,

  morning: {
    light: [
      'Clear morning ahead. Good conditions for the day.',
      'Fine start. No weather concerns this morning.',
      'Mild and clear to begin the day.',
    ],
    default: [
      'Good morning. The weather is cooperating.',
      'Clear skies this morning. No complaints.',
      'Morning conditions: acceptable. Proceed without issue.',
      "It's a fine morning out there.",
    ],
    high: [
      'Morning is happening outside, and conditions are in its favor.',
      'Clear start. The commute is the only obstacle today.',
      'Skies clear, temperature fine. Morning is proceeding correctly.',
      'Good start. The weather got the memo.',
    ],
    roast: [
      "It's morning. The weather is fine. No excuses.",
      "Clear skies, decent temperature. Whatever you're putting off, it's not the weather's fault.",
      'Good morning conditions. The rest is on you.',
      'Perfect morning weather. The weather has done its part.',
    ],
  } satisfies BylineSet,

  evening: {
    light: [
      'Clear skies this evening. Pleasant conditions outside.',
      'Good conditions for an evening out.',
      'Mild and clear tonight.',
    ],
    default: [
      "Clear tonight. Good conditions if you're heading out.",
      'Evening forecast: fine. Nothing concerning to report.',
      'Clear skies this evening. Favorable for being outside.',
      'Tonight looks calm. No weather obstacles.',
    ],
    high: [
      'Evening is clear. The weather has wrapped up its shift without incident.',
      'Clear night. The atmosphere is signing off in a good mood.',
      'Good evening conditions. The sky decided to cooperate.',
      'No weather drama tonight. Unusual, but appreciated.',
    ],
    roast: [
      "It's a nice night. Go outside. The couch will still be there.",
      'Clear evening. No excuses not to make something of it.',
      "Tonight's weather: decent. Don't waste it.",
      'Good night conditions. The weather is not your obstacle tonight.',
    ],
  } satisfies BylineSet,

  niceWeather: {
    light: [
      'Clear skies and comfortable temperatures today.',
      'Pleasant conditions. A good day outside.',
      'Fine weather ahead. No concerns.',
    ],
    default: [
      'Good weather today. Nothing to worry about.',
      'Clear skies, comfortable temperatures. The forecast is in your favor.',
      "It's a decent day. Make what you will of it.",
      'The weather today is unremarkable in the best way.',
    ],
    high: [
      'Clear, comfortable, excellent. The sky is operating at peak performance.',
      'Perfect weather. The kind that makes excuses feel thin.',
      'Gold-tier weather. The birds have already weighed in favorably.',
      'No weather drama. The forecast peaked and stayed there.',
    ],
    roast: [
      'The weather is perfect. A great day to touch some actual grass.',
      "Clear skies, decent temperatures. The weather has done its part.",
      'Perfect conditions. Your only obstacle is yourself.',
      'Good weather today. Squander it however you like.',
    ],
  } satisfies BylineSet,
} satisfies Record<string, BylineSet>;

/**
 * Returns a rule-based byline based on current weather conditions.
 * Seed-based selection rotates through options as inputs change without randomness.
 */
export function getByline(input: BylineInput, mode: HumorMode = 'default'): string {
  const { weatherCode, temp, feelsLike, pop, windSpeed, hour } = input;
  const h = hour ?? 12;

  // Seed rotates by hour + weather values so lines vary across the day and conditions.
  const seed = Math.floor(Math.abs(temp)) + Math.floor(windSpeed) + Math.floor(pop) + h;

  // 1. Heavy rain/storm (pop >= 70 or rain/storm codes)
  const isHeavyRainCode =
    (weatherCode >= 61 && weatherCode <= 67) ||
    (weatherCode >= 80 && weatherCode <= 82) ||
    (weatherCode >= 95 && weatherCode <= 99);
  if (pop >= 70 || isHeavyRainCode) {
    return pick(bylines.heavyRain[mode], seed);
  }

  // 2. Medium rain (pop >= 40 or drizzle codes)
  const isDrizzleCode = weatherCode >= 51 && weatherCode <= 57;
  if (pop >= 40 || isDrizzleCode) {
    return pick(bylines.mediumRain[mode], seed);
  }

  // 3. Light rain (pop >= 20)
  if (pop >= 20) {
    return pick(bylines.lightRain[mode], seed);
  }

  // 4. Snow
  const isSnowCode = weatherCode >= 71 && weatherCode <= 77;
  if (isSnowCode) {
    return pick(bylines.snow[mode], seed);
  }

  // 5. Fog
  const isFogCode = weatherCode >= 45 && weatherCode <= 48;
  if (isFogCode) {
    return pick(bylines.fog[mode], seed);
  }

  // 6. Extreme wind (>= 50 km/h)
  if (windSpeed >= 50) {
    return pick(bylines.extremeWind[mode], seed);
  }

  // 7. High wind (>= 25 km/h)
  if (windSpeed >= 25) {
    return pick(bylines.highWind[mode], seed);
  }

  // 8. Extreme cold (feelsLike <= 0°C)
  if (feelsLike <= 0) {
    return pick(bylines.extremeCold[mode], seed);
  }

  // 9. Very cold (feelsLike <= 8°C)
  if (feelsLike <= 8) {
    return pick(bylines.veryCold[mode], seed);
  }

  // 10. Extreme heat (temp >= 35°C)
  if (temp >= 35) {
    return pick(bylines.extremeHeat[mode], seed);
  }

  // 11. Very hot (temp >= 28°C)
  if (temp >= 28) {
    return pick(bylines.veryHot[mode], seed);
  }

  // 12. Time-of-day context for clear/pleasant conditions
  const isMorning = h >= 5 && h <= 9;
  const isEvening = h >= 19 && h <= 23;
  if (isMorning) {
    return pick(bylines.morning[mode], seed);
  }
  if (isEvening) {
    return pick(bylines.evening[mode], seed);
  }

  // 13. Nice weather fallback
  return pick(bylines.niceWeather[mode], seed);
}
