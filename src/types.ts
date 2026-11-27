import { LovelaceCardConfig } from "custom-card-helpers";

export const CARD_VERSION = "2.0.0";

export type SliderStyle = "tile" | "column";
export type DragMode = "relative" | "absolute";

/** One slider. Every field except `entity` is optional. */
export interface SliderEntityConfig {
  entity: string;
  name?: string;
  icon?: string;
  /** Accent colour, e.g. "#ffcf8a". Defaults depend on the domain (or the light's own colour). */
  accent?: string;
  /** number / input_number range overrides. */
  min?: number;
  max?: number;
  step?: number;
}

export interface SimpleVerticalSliderConfig extends LovelaceCardConfig {
  /** Single-slider form. Ignored when `entities` has items. */
  entity?: string;
  name?: string;
  icon?: string;
  accent?: string;
  /** Multi-slider form. */
  entities?: Array<SliderEntityConfig | string>;

  /** "tile" (default): the whole button is the slider. "column": track + round power button. */
  slider_style?: SliderStyle;
  /** CSS sizes, e.g. "220px", "100%". Unset = follow the dashboard grid. */
  width?: string;
  height?: string;
  /** Multi form: sliders per row (default: all on one row). */
  columns?: number;
  /** Gap between sliders, px. Default 10. */
  gap?: number;
  /** Tile: relative = drag from the current level (default); absolute = level under the finger. */
  drag_mode?: DragMode;
  /** Relative drag: 1 = full tile height is 100 %. Higher = finer. */
  sensitivity?: number;
  /** Coloured border and glow when on. Default true. */
  glow?: boolean;
  /** Lights: use the bulb's current colour as accent when no accent is set. Default true. */
  use_light_color?: boolean;
  /** Default accent for every slider without its own. */
  default_accent?: string;

  /* v1 compatibility */
  fill_color?: string;
  track_color?: string;
  column_bg?: string;
  card_height?: string;
}

export const DEFAULTS = {
  slider_style: "tile" as SliderStyle,
  gap: 10,
  drag_mode: "relative" as DragMode,
  sensitivity: 1,
  glow: true,
  use_light_color: true,
};

/** Per-domain default accents (ebusd / energy-flow palette family). */
export const DOMAIN_ACCENT: Record<string, string> = {
  light: "#ffcf8a",
  switch: "#ffd166",
  input_boolean: "#ffd166",
  fan: "#4fc3f7",
  media_player: "#b39dff",
  number: "#5dcaa5",
  input_number: "#5dcaa5",
};

export const SUPPORTED_DOMAINS = [
  "light",
  "switch",
  "input_boolean",
  "fan",
  "number",
  "input_number",
  "media_player",
];

declare global {
  interface Window {
    customCards?: Array<Record<string, unknown>>;
  }
}
