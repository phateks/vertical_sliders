import { LitElement, html, nothing, PropertyValues, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { HomeAssistant } from "custom-card-helpers";
import { CARD_VERSION, DEFAULTS, SUPPORTED_DOMAINS, SimpleVerticalSliderConfig, SliderEntityConfig } from "./types";
import { cardStyles } from "./styles";
import { SliderOptions } from "./slider";
import "./slider";
import "./editor";

/* eslint-disable no-console */
console.info(
  `%c SIMPLE-VERTICAL-SLIDER %c v${CARD_VERSION} `,
  "color:#16243a;background:#ffcf8a;font-weight:700;border-radius:4px 0 0 4px;padding:2px 6px;",
  "color:#ffcf8a;background:#16243a;font-weight:700;border-radius:0 4px 4px 0;padding:2px 6px;"
);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "simple-vertical-slider",
  name: "Simple Vertical Slider",
  description: "Vertical slider tiles: tap to toggle, hold and drag to dim. Lights, fans, switches, numbers, media.",
  preview: true,
  documentationURL: "https://github.com/phateks/vertical_sliders",
});

const cssSize = (v?: string | number) =>
  v === undefined || v === null || v === "" ? undefined : typeof v === "number" || /^\d+(\.\d+)?$/.test(v) ? `${v}px` : v;

@customElement("simple-vertical-slider")
export class SimpleVerticalSlider extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _config!: SimpleVerticalSliderConfig;

  static styles = cardStyles;

  public static async getConfigElement() {
    return document.createElement("simple-vertical-slider-editor");
  }

  public static getStubConfig(hass?: HomeAssistant): SimpleVerticalSliderConfig {
    const ids = Object.keys(hass?.states ?? {});
    const light = ids.find((id) => id.startsWith("light.")) ?? ids.find((id) => SUPPORTED_DOMAINS.includes(id.split(".")[0]));
    return { type: "custom:simple-vertical-slider", entity: light ?? "light.example" };
  }

  public setConfig(config: SimpleVerticalSliderConfig): void {
    if (!config) throw new Error("Invalid configuration");
    this._config = config;
  }

  public getCardSize(): number {
    return 4;
  }

  public getGridOptions() {
    const n = Math.max(1, this._entities(this._config).length);
    const perRow = Math.min(n, this._config?.columns ?? n);
    const rows = Math.ceil(n / perRow);
    return {
      columns: Math.min(12, perRow * 3),
      rows: rows * 4,
      min_columns: Math.min(12, perRow),
      min_rows: rows * 2,
    };
  }

  /** Normalised list: `entities` (strings allowed) or the single `entity`. */
  private _entities(c?: SimpleVerticalSliderConfig): SliderEntityConfig[] {
    if (!c) return [];
    const list = (c.entities ?? [])
      .filter((e) => !!e)
      .map((e) => (typeof e === "string" ? { entity: e } : e))
      .filter((e) => !!e.entity);
    if (list.length) return list;
    return c.entity ? [{ entity: c.entity, name: c.name, icon: c.icon, accent: c.accent }] : [];
  }

  protected updated(changed: PropertyValues): void {
    if (changed.has("hass") && this.hass) {
      const dark = (this.hass as any).themes?.darkMode;
      this.toggleAttribute("light", dark === false);
    }
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this._config || !this.hass) return nothing;
    const c = this._config;
    const list = this._entities(c);
    if (!list.length) return html`<ha-card><div class="warning">Pick an entity in the editor.</div></ha-card>`;
    const style = c.slider_style ?? DEFAULTS.slider_style;
    const opts: SliderOptions = {
      style,
      dragMode: c.drag_mode ?? (style === "column" ? "absolute" : DEFAULTS.drag_mode),
      sensitivity: Number(c.sensitivity) > 0 ? Number(c.sensitivity) : DEFAULTS.sensitivity,
      glow: c.glow ?? DEFAULTS.glow,
      useLightColor: c.use_light_color ?? DEFAULTS.use_light_color,
      defaultAccent: c.default_accent ?? c.fill_color,
    };

    const perRow = Math.max(1, Math.min(list.length, Number(c.columns) || list.length));
    const width = cssSize(c.width);
    const height = cssSize(c.height ?? c.card_height);
    const gap = Number(c.gap ?? DEFAULTS.gap);
    const cols = width ? `repeat(${perRow}, ${width})` : `repeat(${perRow}, minmax(0, 1fr))`;
    const rows = Math.ceil(list.length / perRow);
    const rowSize = height ?? "minmax(0, 1fr)";
    const gridStyle = `grid-template-columns:${cols};grid-template-rows:repeat(${rows}, ${rowSize});gap:${gap}px;`;
    const sliderStyle = [height ? `height:${height};aspect-ratio:auto` : "", c.column_bg ? `--svs-surface:${c.column_bg}` : ""]
      .filter(Boolean)
      .join(";");

    return html`<ha-card>
      <div class="grid" style=${gridStyle}>
        ${list.map(
          (e) => html`<svs-slider style=${sliderStyle} .hass=${this.hass} .cfg=${e} .opts=${opts}></svs-slider>`
        )}
      </div>
    </ha-card>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "simple-vertical-slider": SimpleVerticalSlider;
  }
}
