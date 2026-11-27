import { LitElement, html, css, nothing, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { HomeAssistant, LovelaceCardEditor, fireEvent } from "custom-card-helpers";
import { SUPPORTED_DOMAINS, SimpleVerticalSliderConfig, SliderEntityConfig } from "./types";

const entitySel = { entity: { domain: SUPPORTED_DOMAINS } };
const text = (name: string) => ({ name, selector: { text: {} } });
const num = (name: string, min: number, max: number, step = 1) => ({
  name,
  selector: { number: { min, max, step, mode: "box" } },
});
const grid = (schema: unknown[]) => ({ type: "grid", name: "", schema });

const SINGLE_SCHEMA = [
  { name: "entity", selector: entitySel },
  grid([text("name"), { name: "icon", selector: { icon: {} } }]),
  text("accent"),
];

const LAYOUT_SCHEMA = [
  grid([
    {
      name: "slider_style",
      selector: {
        select: {
          mode: "dropdown",
          options: [
            { value: "tile", label: "Tile (whole button is the slider)" },
            { value: "column", label: "Column (track + power button)" },
          ],
        },
      },
    },
    {
      name: "drag_mode",
      selector: {
        select: {
          mode: "dropdown",
          options: [
            { value: "relative", label: "Relative (from current level)" },
            { value: "absolute", label: "Absolute (level under finger)" },
          ],
        },
      },
    },
  ]),
  grid([text("width"), text("height")]),
  grid([num("columns", 1, 12), num("gap", 0, 40)]),
  grid([num("sensitivity", 0.25, 4, 0.25), text("default_accent")]),
  grid([
    { name: "glow", selector: { boolean: {} } },
    { name: "use_light_color", selector: { boolean: {} } },
  ]),
];

const ITEM_SCHEMA = [
  { name: "entity", selector: entitySel },
  grid([text("name"), { name: "icon", selector: { icon: {} } }]),
  text("accent"),
  grid([num("min", -1000, 1000, 0.1), num("max", -1000, 1000, 0.1)]),
  num("step", 0, 100, 0.01),
];

const LABELS: Record<string, string> = {
  entity: "Entity",
  name: "Name (optional)",
  icon: "Icon (optional)",
  accent: "Accent colour (optional, e.g. #ffcf8a)",
  slider_style: "Style",
  drag_mode: "Drag",
  width: "Width (optional, e.g. 120px)",
  height: "Height (optional, e.g. 220px)",
  columns: "Sliders per row (multi)",
  gap: "Gap (px)",
  sensitivity: "Drag sensitivity (1 = full height)",
  default_accent: "Default accent (optional)",
  glow: "Glow when on",
  use_light_color: "Use the light's colour",
  min: "Min (number only)",
  max: "Max (number only)",
  step: "Step (number only)",
};

const clean = <T extends object>(o: T): T => {
  const c = { ...o } as Record<string, unknown>;
  for (const k of Object.keys(c)) if (c[k] === "" || c[k] === undefined || c[k] === null) delete c[k];
  return c as T;
};

@customElement("simple-vertical-slider-editor")
export class SimpleVerticalSliderEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _config!: SimpleVerticalSliderConfig;

  public setConfig(config: SimpleVerticalSliderConfig): void {
    const entities = (config.entities ?? []).map((e) => (typeof e === "string" ? { entity: e } : e));
    this._config = { ...config, entities };
  }

  private _label = (s: { name: string }) => LABELS[s.name] ?? s.name;

  private get _list(): SliderEntityConfig[] {
    return (this._config.entities ?? []) as SliderEntityConfig[];
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this.hass || !this._config) return nothing;
    const multi = this._list.length > 0;
    return html`
      ${multi
        ? nothing
        : html`<div class="section">Slider</div>
            <ha-form
              .hass=${this.hass}
              .data=${this._config}
              .schema=${SINGLE_SCHEMA}
              .computeLabel=${this._label}
              @value-changed=${this._mainChanged}
            ></ha-form>`}

      <div class="section">Layout</div>
      <ha-form
        .hass=${this.hass}
        .data=${{ slider_style: "tile", drag_mode: "relative", glow: true, use_light_color: true, ...this._config }}
        .schema=${LAYOUT_SCHEMA}
        .computeLabel=${this._label}
        @value-changed=${this._mainChanged}
      ></ha-form>

      <div class="section">Multiple sliders</div>
      ${this._list.map((e, i) => this._item(i, e))}
      <button class="add" @click=${this._add}>+ Add slider</button>
    `;
  }

  private _item(i: number, data: SliderEntityConfig): TemplateResult {
    const title = data.name || this.hass.states[data.entity]?.attributes.friendly_name || data.entity || `Slider ${i + 1}`;
    return html`<ha-expansion-panel outlined .header=${title}>
      <ha-form
        .hass=${this.hass}
        .data=${data}
        .schema=${ITEM_SCHEMA}
        .computeLabel=${this._label}
        @value-changed=${(ev: CustomEvent) => this._itemChanged(i, ev)}
      ></ha-form>
      <div class="row">
        <button ?disabled=${i === 0} @click=${() => this._move(i, -1)}>↑</button>
        <button ?disabled=${i === this._list.length - 1} @click=${() => this._move(i, 1)}>↓</button>
        <button class="del" @click=${() => this._remove(i)}>Remove</button>
      </div>
    </ha-expansion-panel>`;
  }

  private _emit(config: SimpleVerticalSliderConfig): void {
    const out = { ...config };
    if (!out.entities || !out.entities.length) delete out.entities;
    this._config = { ...config, entities: config.entities ?? [] };
    fireEvent(this as any, "config-changed", { config: out });
  }

  private _mainChanged(ev: CustomEvent): void {
    ev.stopPropagation();
    const v = clean(ev.detail.value as SimpleVerticalSliderConfig);
    this._emit({ ...v, entities: this._list });
  }

  private _itemChanged(i: number, ev: CustomEvent): void {
    ev.stopPropagation();
    const list = [...this._list];
    list[i] = clean(ev.detail.value);
    this._emit({ ...this._config, entities: list });
  }

  private _add = (): void => {
    const list = [...this._list];
    // first item of a new list takes over the single entity
    if (!list.length && this._config.entity) {
      list.push(clean({ entity: this._config.entity, name: this._config.name, icon: this._config.icon, accent: this._config.accent }));
    }
    list.push({ entity: "" });
    const next = { ...this._config, entities: list };
    delete next.entity;
    delete next.name;
    delete next.icon;
    delete next.accent;
    this._emit(next);
  };

  private _remove(i: number): void {
    const list = [...this._list];
    const [removed] = list.splice(i, 1);
    const next: SimpleVerticalSliderConfig = { ...this._config, entities: list };
    // removing the last slider brings back the single-entity form
    if (!list.length && removed?.entity) next.entity = removed.entity;
    this._emit(next);
  }

  private _move(i: number, d: number): void {
    const list = [...this._list];
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    this._emit({ ...this._config, entities: list });
  }

  static styles = css`
    .section {
      margin: 18px 0 6px;
      font-weight: 600;
      font-size: 15px;
    }
    .section:first-child {
      margin-top: 0;
    }
    .hint {
      font-size: 13px;
      color: var(--secondary-text-color);
      margin-bottom: 4px;
    }
    ha-expansion-panel {
      display: block;
      margin-bottom: 8px;
      --expansion-panel-content-padding: 8px 12px;
    }
    .row {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
      margin-top: 8px;
    }
    button {
      font: inherit;
      font-size: 13px;
      padding: 4px 12px;
      border-radius: 8px;
      border: 1px solid var(--divider-color);
      background: transparent;
      color: var(--primary-text-color);
      cursor: pointer;
    }
    button:disabled {
      opacity: 0.4;
      cursor: default;
    }
    button.del {
      color: var(--error-color, #db4437);
    }
    button.add {
      width: 100%;
      padding: 8px;
      border-style: dashed;
    }
  `;
}
