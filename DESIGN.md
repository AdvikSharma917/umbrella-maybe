---
name: Umbrella Maybe
description: A dry, premium weather utility that tells you one thing and tells you with a straight face.
colors:
  void: "#020617"
  abyss: "#09090b"
  deep-surface: "#0f172a"
  sky-signal: "#38bdf8"
  rain-alarm: "#fb7185"
  hedge-amber: "#fbbf24"
  clear-emerald: "#34d399"
  storm-violet: "#818cf8"
typography:
  display:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "clamp(4rem, 15vw, 9rem)"
    fontWeight: 100
    lineHeight: 1
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 300
    lineHeight: 1.2
    letterSpacing: "0.025em"
  title:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.1em"
rounded:
  full: "9999px"
  3xl: "24px"
  2xl: "16px"
  xl: "12px"
spacing:
  sm: "16px"
  md: "20px"
  lg: "24px"
components:
  status-badge-yes:
    backgroundColor: "#fb7185"
    textColor: "#fff"
    rounded: "{rounded.full}"
    padding: "4px 14px"
  status-badge-maybe:
    backgroundColor: "#fbbf24"
    textColor: "#000"
    rounded: "{rounded.full}"
    padding: "4px 14px"
  status-badge-clear:
    backgroundColor: "{colors.clear-emerald}"
    textColor: "#000"
    rounded: "{rounded.full}"
    padding: "4px 14px"
  data-card:
    backgroundColor: "rgba(255,255,255,0.05)"
    textColor: "#fff"
    rounded: "{rounded.3xl}"
    padding: "{spacing.md}"
  search-input:
    backgroundColor: "rgba(255,255,255,0.05)"
    textColor: "#fff"
    rounded: "{rounded.2xl}"
    padding: "10px 16px 10px 40px"
  icon-button:
    backgroundColor: "rgba(255,255,255,0.05)"
    textColor: "rgba(255,255,255,0.7)"
    rounded: "{rounded.xl}"
    size: "32px"
---

# Design System: Umbrella Maybe

## 1. Overview

**Creative North Star: "The Deadpan Forecaster"**

This design system is built around a single tension: a serious, meticulous instrument that occasionally says something funny. The interface never winks. Every surface, spacing choice, and type decision is pulled toward quiet premium precision. The humor exists only in the copy. If you removed all the bylines and replaced them with bland advice, the UI would be unremarkable and appropriate. That restraint is what makes the bylines land.

The visual grammar is deep-dark glassmorphic: near-black backgrounds at `slate-950`/`zinc-950`, surfaces rendered as frosted overlays (`white/5` to `white/10` + `backdrop-blur`), and a single brand accent in sky blue (`sky-400`) that carries double meaning as both the brand wordmark color and the precipitation data signal. Weather states bleed through in subtle background gradient shifts (amber warmth for sun, blue for rain, violet for storms) so the UI communicates condition without a single label.

Type is the other instrument. The temperature number runs extralight at 9rem — all negative space and quiet confidence. City names are thin-weight, spacious. Section labels are 10px all-caps with wide tracking, the most deliberate typographic choice in the system: they whisper so the data can speak.

**Key Characteristics:**
- Dark-native. Light mode is not a consideration; the whole system is designed for darkness.
- Weather-reactive backgrounds. Subtle gradient shifts telegraph condition before the user reads anything.
- Glassmorphic restraint. Frosted surfaces create depth without noise; no pane is purely decorative.
- Single accent. `sky-400` is the only chromatic color that belongs to the brand identity. Status colors (rose, amber, emerald) are system signals, not brand expression.
- Uniform card radius. All data containers use `rounded-3xl` (24px). No mixing.
- Humility of size. The temperature number is massive; everything else steps back.

## 2. Colors: The Night Shift Palette

One dark ground, one sky signal, three status indicators. The palette is deliberately lean.

### Primary
- **Sky Signal** (`#38bdf8` / `oklch(72% 0.15 223)`): The sole brand accent. Used for the "Maybe" logotype wordmark and as the precipitation percentage indicator. Its double role is deliberate: the brand is weather-adjacent. Never used as a fill on large surfaces.

### Secondary
- **Storm Violet** (`#818cf8` / `oklch(66% 0.18 264)`): Used in the thunderstorm background gradient and the loading spinner ring. An atmospheric accent, not a brand color.

### Neutral
- **Void** (`#020617`): Primary background. The deepest dark; `slate-950`. Every screen sits on this.
- **Abyss** (`#09090b`): Secondary background variant; `zinc-950`. Used in gradients alongside Void.
- **Deep Surface** (`#0f172a`): Mid-ground dark; `slate-900`. Appears in daytime gradient targets and card gradient tops.
- **Surface Overlay**: `rgba(255,255,255,0.05)` — the base for every data card. Not a token but a pattern: cards are frosted glass at 5% white, never filled with an opaque color.

### Status (system signals, not brand expression)
- **Rain Alarm** (`#fb7185` / `oklch(68% 0.18 10)`): Umbrella Yes state. Rose.
- **Hedge Amber** (`#fbbf24` / `oklch(83% 0.16 85)`): Umbrella Maybe state. Amber.
- **Clear Emerald** (`#34d399` / `oklch(78% 0.16 160)`): Umbrella No / Saved state. Emerald.

### Named Rules
**The One Signal Rule.** Sky blue is the only brand accent. Status colors (rose, amber, emerald) are data; they communicate umbrella state, nothing else. Never use rose, amber, or emerald for decorative or brand purposes.

**The Glass-Not-Fill Rule.** Data card backgrounds are `rgba(white, 0.05)` with `backdrop-blur`. Never use a solid opaque background on a card. Transparency is load-bearing: it shows the weather gradient bleed-through beneath.

## 3. Typography

**Display Font:** Geist (with Arial, sans-serif fallback)
**Body Font:** Geist (same family; hierarchy achieved through weight and size, not family switching)
**Label/Mono Font:** Geist (Geist Mono available via `--font-geist-mono` for data contexts)

**Character:** A single variable-weight sans that spans extralight to extrabold within the same family. The contrast between the 100-weight temperature display and the 700-weight section labels is extreme — nearly 7 weight stops — and that contrast does all the hierarchical work. No display/body split; one family, full commitment.

### Hierarchy
- **Display** (weight 100, `clamp(4rem, 15vw, 9rem)`, leading 1, tracking -0.04em): The temperature number only. Occupies most of the viewport vertical real estate. Nothing else uses this weight at this scale.
- **Headline** (weight 300, 1.875rem / 30px, leading 1.2, tracking 0.025em): City name in the main weather view. Light, open, calm.
- **Title** (weight 700–800, 1.25rem / 20px, leading 1.3, tracking -0.01em): Saved city names in the list cards. Bold contrast to the extralight display.
- **Body** (weight 400–600, 0.875rem / 14px, leading 1.6): General weather descriptions, advice copy, search results. Max line length 65ch.
- **Label** (weight 700, 0.625rem / 10px, letter-spacing 0.1em, all-caps): Section headers ("Hourly Forecast", "7-Day Forecast", "Umbrella Verdict"). The whisper that introduces the data.

### Named Rules
**The Extralight Display Rule.** The temperature number is the only element permitted at weight 100. Using extralight on any other element dilutes the display hierarchy. Everything else starts at 300 (light) at minimum.

**The Label Silence Rule.** Section labels at 10px all-caps and `white/35` opacity exist to identify, not to compete. They should always be the quietest text on the page.

## 4. Elevation

This system uses tonal layering, not structural shadows. The ground (Void, `slate-950`) is the darkest layer. Data cards float above it using a frosted glass treatment: `background: rgba(255,255,255,0.05)` + `backdrop-filter: blur(12px)` + `border: 1px solid rgba(255,255,255,0.10)`. The blur lets the weather-reactive gradient beneath bleed through, so elevation communicates both depth and weather state simultaneously. `box-shadow: lg` (`0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)`) provides structural grounding. There is no tonal elevation above the card layer; the hierarchy is two-deep: ground → glass surface.

### Shadow Vocabulary
- **Card grounding** (`box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)`): Applied to all data cards. Ambient, not dramatic.
- **Dropdown depth** (`box-shadow: 0 12px 40px rgba(0,0,0,0.5)`): Applied to the search results dropdown only. Heavier shadow to separate the dropdown from the sticky header context.

### Named Rules
**The Two-Layer Rule.** There are exactly two elevation levels: the page ground and the glass surface. No cards-inside-cards, no elevated sub-sections inside cards. A card is a terminal surface.

**The Flatness-At-Rest Rule.** Surfaces are flat at rest. The `hover:scale-[1.01]` and `hover:border-white/15` transitions respond to interaction; they don't animate autonomously. Motion is feedback, not decoration.

## 5. Components

### Search Input
Slim, rounded-2xl field (16px radius) with a frosted glass background (`white/5`). Left-inset search icon in `white/50`. Placeholder text at `white/45` — deliberately close to the border of 4.5:1 contrast; any dimmer than `/45` against Void fails WCAG AA. Focus state shifts border to `white/20` and adds a `ring-1 ring-white/10`. Backdrop blur makes it feel integrated with the sticky header glass. No label visible (screen-reader-only `<label>`); the placeholder carries the affordance.

### Status Badges (Umbrella verdict chips)
Pill shape (`rounded-full`), small text at 10px bold uppercase wide-tracked. Color assignment:
- Yes: rose tint (`border-rose-500/30 bg-rose-950/30`), text `rose-400`
- Maybe: amber tint (`border-amber-500/30 bg-amber-950/30`), text `amber-400`
- No: emerald tint (`border-emerald-500/30 bg-emerald-950/30`), text `emerald-400`
All three use `backdrop-blur-md` so the weather gradient bleeds through them. These are the most color-saturated elements in the system; they earn their visual prominence because they ARE the product answer.

### Data Cards
Uniform shape: `rounded-3xl` (24px), `bg-white/5`, `border border-white/10`, `backdrop-blur-md`, `shadow-lg`, padding `p-5` (20px). Hover state shifts border to `white/15` with `transition-colors`. Every data section (umbrella advice, hourly forecast, 7-day, stats) uses this exact treatment with no variation. **The uniformity is the system.** The content varies; the container never does.

### Icon Containers (within cards)
Smaller glass tiles: `rounded-2xl`, `bg-white/5`, `border border-white/10`, `p-2.5`. Color from the status signal (rose/amber/emerald based on umbrella state). These are inset decorative anchors, not interactive.

### Icon Button (Settings gear, etc.)
32×32px, `rounded-xl` (12px), `bg-white/5 border border-white/10`. Text color `white/70` at rest, transitions to `white` on hover. `hover:bg-white/10 hover:border-white/15`. `active:scale-95`. Compact, quiet, undemanding of attention.

### Carousel + Pagination Dots
The main weather display scrolls horizontally with `scroll-snap`. Pagination dots: 6×6px circles, `bg-white/30` inactive, `bg-white scale-125` active. The dots are the subtlest navigation affordance in the system — enough to orient, not enough to distract.

### Saved Location Cards
Gradient-tinted cards (`bg-gradient-to-b` from a weather-condition-specific tint to transparent) so each city's card reflects its actual weather. `rounded-3xl`, hover lifts at `scale-[1.01]`, active depresses at `scale-[0.99]`. An atmospheric glow (`w-24 h-24 bg-white/5 rounded-full blur-2xl`) decorates the upper right corner as a subtle ambient light source.

### Loading Skeleton
Cards render as `animate-pulse` blocks (`bg-white/10 rounded-full/3xl`) at exact final dimensions. No layout shift on data arrival. The skeleton uses the same rounded values as real content so the transition is seamless.

## 6. Do's and Don'ts

### Do:
- **Do** use `rounded-3xl` (24px) for all primary data card containers. Consistency is the system.
- **Do** keep the single temperature number at weight 100 (extralight). That contrast is the whole display hierarchy.
- **Do** let the weather-reactive gradient bleed through frosted card surfaces. The transparency is functional.
- **Do** use `white/35` and all-caps 10px labels for section headers. They identify; they don't compete.
- **Do** reserve sky blue exclusively for the brand wordmark and precipitation percentage. Its scarcity is its meaning.
- **Do** use status colors (rose/amber/emerald) only for umbrella verdict contexts. They are data signals, not decoration.
- **Do** respect `prefers-reduced-motion`: all transitions and scale animations must degrade to instant or opacity-only crossfades.
- **Do** confirm that all body text hits 4.5:1 contrast against Void. The `white/45` placeholder is the floor; never go dimmer than that.

### Don't:
- **Don't** use a warm or cream-tinted background. This system is cold-dark. A warm neutral body bg reads as generic 2026 AI output and breaks the night-sky aesthetic.
- **Don't** use gradient text (`background-clip: text`). Sky blue is solid, not gradient. No exceptions.
- **Don't** use `border-left` as a colored stripe accent on cards. Full borders (`border border-white/10`) or nothing.
- **Don't** use nested cards. A card is a terminal surface per the Two-Layer Rule. No `bg-white/5` panel inside another `bg-white/5` panel.
- **Don't** use blue sky imagery, sun gradients, or cheerful light palettes. The anti-reference is AccuWeather: corporate, bright, forgettable.
- **Don't** apply the label eyebrow pattern (all-caps small text) to every section reflexively. It's already in use for section headers; adding it to body copy or card titles breaks the hierarchy.
- **Don't** add SaaS energy: metrics-card grids, hero stat counters, "built for teams" copy, gradient CTAs.
- **Don't** animate layout properties. Only `transform` (scale), `opacity`, `border-color`, `background-color` transitions. No height/width animation.
- **Don't** use glassmorphism decoratively. Every `backdrop-blur` surface exists to expose the weather gradient beneath it, not as a visual style choice in isolation.
