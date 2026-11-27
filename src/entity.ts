import { HomeAssistant } from "custom-card-helpers";
import { DOMAIN_ACCENT, SliderEntityConfig } from "./types";

type StateObj = HomeAssistant["states"][string];

export type SliderMode = "level" | "temp";

/** Everything the slider needs to draw one entity, derived from its state. */
export interface SliderModel {
  entityId: string;
  domain: string;
  stateObj?: StateObj;
  name: string;
  unavailable: boolean;
  on: boolean;
  /** 0..100, what the fill shows. */
  level: number;
  /** Can be dragged (lights with brightness, fans, numbers, media). */
  draggable: boolean;
  /** Tap toggles (everything except numbers). */
  toggleable: boolean;
  /** Light supports colour temperature (enables the temp mode in the hold menu). */
  supportsTemp: boolean;
  /** Light supports hue colour. */
  supportsColor: boolean;
  accent: string;
  /** Text shown while dragging, e.g. "65%", "21.5 °C". */
  format: (pct: number) => string;
  /** Step in percent the drag snaps to (fan percentage_step, number step). */
  snap: number;
}

const clamp = (v: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, v));

export const domainOf = (id: string) => (id || "").split(".")[0];

/** Light groups expose brightness themselves; fall back to the first member when they don't. */
function lightBrightness(hass: HomeAssistant, s: StateObj): number | undefined {
  const b = s.attributes.brightness;
  if (typeof b === "number") return b;
  const members = s.attributes.entity_id;
  if (Array.isArray(members)) {
    for (const m of members) {
      const mb = hass.states[m]?.attributes.brightness;
      if (typeof mb === "number") return mb;
    }
  }
  return undefined;
}

function kelvinToRgb(k: number): [number, number, number] {
  k = Math.max(1000, Math.min(12000, k)) / 100;
  let r: number, g: number, b: number;
  if (k <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(k) - 161.1195681661;
    b = k <= 19 ? 0 : 138.5177312231 * Math.log(k - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(k - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(k - 60, -0.0755148492);
    b = 255;
  }
  const c = (v: number) => Math.round(clamp(v, 0, 255));
  return [c(r), c(g), c(b)];
}

const rgbHex = ([r, g, b]: number[]) =>
  "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

/** Mixes a colour toward white so very dark bulb colours still read as an accent. */
function liftColor(rgb: number[]): string {
  const lum = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
  if (lum >= 0.45) return rgbHex(rgb);
  const t = 0.45 - lum;
  return rgbHex(rgb.map((v) => v + (255 - v) * t));
}

export function tempRange(s?: StateObj): [number, number] {
  const a = s?.attributes ?? {};
  return [a.min_color_temp_kelvin ?? 2000, a.max_color_temp_kelvin ?? 6500];
}

export function buildModel(
  hass: HomeAssistant,
  cfg: SliderEntityConfig,
  opts: { useLightColor: boolean; defaultAccent?: string; mode: SliderMode }
): SliderModel {
  const entityId = cfg.entity;
  const domain = domainOf(entityId);
  const s = hass.states[entityId];
  const unavailable = !s || s.state === "unavailable" || s.state === "unknown";
  const name = cfg.name ?? s?.attributes.friendly_name ?? entityId;
  let accent = cfg.accent ?? opts.defaultAccent ?? DOMAIN_ACCENT[domain] ?? "#ffcf8a";

  const base: SliderModel = {
    entityId,
    domain,
    stateObj: s,
    name,
    unavailable,
    on: false,
    level: 0,
    draggable: false,
    toggleable: true,
    supportsTemp: false,
    supportsColor: false,
    accent,
    format: (p) => `${Math.round(p)}%`,
    snap: 1,
  };
  if (!s) return base;
  const a = s.attributes;

  switch (domain) {
    case "light": {
      const modes: string[] = a.supported_color_modes ?? [];
      const dimmable = modes.some((m) => m !== "onoff") || typeof a.brightness === "number";
      base.on = s.state === "on";
      base.draggable = dimmable;
      base.supportsTemp = modes.includes("color_temp");
      base.supportsColor = modes.some((m) => ["hs", "rgb", "rgbw", "rgbww", "xy"].includes(m));
      const b = lightBrightness(hass, s);
      base.level = base.on ? (b !== undefined ? Math.max(1, Math.round(b / 2.55)) : 100) : 0;
      if (base.on && opts.useLightColor && !cfg.accent) {
        if (Array.isArray(a.rgb_color) && a.color_mode !== "color_temp") accent = liftColor(a.rgb_color);
        else if (typeof a.color_temp_kelvin === "number") accent = rgbHex(kelvinToRgb(a.color_temp_kelvin));
        base.accent = accent;
      }
      if (opts.mode === "temp" && base.supportsTemp) {
        const [lo, hi] = tempRange(s);
        const k = a.color_temp_kelvin ?? (lo + hi) / 2;
        base.level = clamp(((k - lo) / (hi - lo)) * 100);
        base.format = (p) => `${Math.round(lo + (p / 100) * (hi - lo))} K`;
      }
      break;
    }
    case "fan": {
      base.on = s.state === "on";
      base.draggable = typeof a.percentage === "number" || ((a.supported_features ?? 0) & 1) !== 0;
      base.level = base.on ? (typeof a.percentage === "number" ? Math.round(a.percentage) : 100) : 0;
      base.snap = typeof a.percentage_step === "number" && a.percentage_step > 1 ? a.percentage_step : 1;
      break;
    }
    case "switch":
    case "input_boolean": {
      base.on = s.state === "on";
      base.level = base.on ? 100 : 0;
      break;
    }
    case "number":
    case "input_number": {
      const lo = cfg.min ?? Number(a.min ?? 0);
      const hi = cfg.max ?? Number(a.max ?? 100);
      const step = cfg.step ?? Number(a.step ?? 1);
      const v = Number(s.state);
      const unit = a.unit_of_measurement ? ` ${a.unit_of_measurement}` : "";
      const decimals = (String(step).split(".")[1] || "").length;
      base.on = true;
      base.toggleable = false;
      base.draggable = hi > lo;
      base.level = Number.isFinite(v) && hi > lo ? clamp(((v - lo) / (hi - lo)) * 100) : 0;
      base.snap = hi > lo && step > 0 ? (step / (hi - lo)) * 100 : 1;
      base.format = (p) => `${(lo + (p / 100) * (hi - lo)).toFixed(decimals)}${unit}`;
      break;
    }
    case "media_player": {
      const vol = typeof a.volume_level === "number" ? a.volume_level : 0;
      base.on = !["off", "standby", "idle", "unavailable"].includes(s.state) && !a.is_volume_muted;
      base.draggable = true;
      base.level = Math.round(vol * 100);
      break;
    }
    default:
      base.on = s.state === "on";
      base.level = base.on ? 100 : 0;
  }
  if (unavailable) {
    base.on = false;
    base.draggable = false;
    base.toggleable = false;
  }
  return base;
}

/** Applies a new 0..100 value to the entity. */
export function commitLevel(hass: HomeAssistant, m: SliderModel, pct: number, mode: SliderMode, cfg: SliderEntityConfig) {
  const id = m.entityId;
  pct = clamp(pct);
  switch (m.domain) {
    case "light":
      if (mode === "temp") {
        const [lo, hi] = tempRange(m.stateObj);
        hass.callService("light", "turn_on", {
          entity_id: id,
          color_temp_kelvin: Math.round(lo + (pct / 100) * (hi - lo)),
        });
      } else if (pct <= 0) hass.callService("light", "turn_off", { entity_id: id });
      else hass.callService("light", "turn_on", { entity_id: id, brightness_pct: Math.round(pct) });
      return;
    case "fan":
      if (pct <= 0) hass.callService("fan", "turn_off", { entity_id: id });
      else hass.callService("fan", "set_percentage", { entity_id: id, percentage: Math.round(pct) });
      return;
    case "number":
    case "input_number": {
      const a = m.stateObj?.attributes ?? {};
      const lo = cfg.min ?? Number(a.min ?? 0);
      const hi = cfg.max ?? Number(a.max ?? 100);
      const step = cfg.step ?? Number(a.step ?? 1);
      let v = lo + (pct / 100) * (hi - lo);
      if (step > 0) v = Math.round((v - lo) / step) * step + lo;
      v = Number(Math.min(hi, Math.max(lo, v)).toFixed(6));
      hass.callService(m.domain, "set_value", { entity_id: id, value: v });
      return;
    }
    case "media_player":
      hass.callService("media_player", "volume_set", {
        entity_id: id,
        volume_level: Number((pct / 100).toFixed(2)),
      });
      return;
  }
}

export function toggle(hass: HomeAssistant, m: SliderModel) {
  if (m.domain === "media_player") {
    hass.callService("media_player", "volume_mute", {
      entity_id: m.entityId,
      is_volume_muted: !m.stateObj?.attributes.is_volume_muted,
    });
    return;
  }
  hass.callService("homeassistant", "toggle", { entity_id: m.entityId });
}

/** Snaps a percentage to the model's step. */
export const snapTo = (pct: number, snap: number) =>
  clamp(snap > 1 ? Math.round(pct / snap) * snap : Math.round(pct));

/** Temperature-mode track: warm at the bottom, cold on top. */
export function tempGradient(s?: StateObj): string {
  const [lo, hi] = tempRange(s);
  const stops = [0, 0.25, 0.5, 0.75, 1].map((t) => rgbHex(kelvinToRgb(lo + t * (hi - lo))));
  return `linear-gradient(to top, ${stops.join(", ")})`;
}
