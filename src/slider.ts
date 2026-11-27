import { LitElement, html, nothing, PropertyValues, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { HomeAssistant, fireEvent } from "custom-card-helpers";
import { DragMode, SliderEntityConfig, SliderStyle } from "./types";
import { SliderMode, SliderModel, buildModel, commitLevel, snapTo, tempGradient, toggle } from "./entity";
import { sliderStyles } from "./styles";

export interface SliderOptions {
  style: SliderStyle;
  dragMode: DragMode;
  sensitivity: number;
  glow: boolean;
  useLightColor: boolean;
  defaultAccent?: string;
}

/** Touch: hold still this long to start dimming (until then the page can scroll). */
const ARM_MS = 280;
/** Hold still this long for the menu / more-info. */
const HOLD_MS = 800;
const MOVE_PX = 8;
/** A touch that starts this soon after a scroll only stops the scroll: no tap. */
const SCROLL_GRACE_MS = 350;

let lastScroll = 0;
window.addEventListener("scroll", () => (lastScroll = Date.now()), { capture: true, passive: true });
/** How long a sent value is shown while waiting for HA to report it. */
const PENDING_MS = 4000;

@customElement("svs-slider")
export class SvsSlider extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) public cfg!: SliderEntityConfig;
  @property({ attribute: false }) public opts!: SliderOptions;

  @state() private _mode: SliderMode = "level";
  @state() private _drag: number | null = null;
  @state() private _menu = false;
  @state() private _pending: { value: number; until: number } | null = null;

  private _model?: SliderModel;
  private _p = {
    id: -1,
    touch: false,
    x0: 0,
    y0: 0,
    start: 0,
    moved: false,
    armed: false,
    held: false,
    noTap: false,
    armTimer: 0,
    holdTimer: 0,
  };

  constructor() {
    super();
    // Once armed, a touch drag must not scroll the page. Only a non-passive
    // touchmove can stop it; until then touch-action: pan-y lets the page scroll.
    this.addEventListener(
      "touchmove",
      (e) => {
        if (this._p.id !== -1 && this._p.armed && e.cancelable) e.preventDefault();
      },
      { passive: false }
    );
  }

  static styles = sliderStyles;

  protected shouldUpdate(changed: PropertyValues): boolean {
    if (!changed.has("hass") || changed.size > 1) return true;
    const old = changed.get("hass") as HomeAssistant | undefined;
    const id = this.cfg?.entity;
    if (!old || !id) return true;
    if (old.states[id] !== this.hass.states[id]) return true;
    // light groups: members change brightness without the group object changing
    const members = this.hass.states[id]?.attributes.entity_id;
    return Array.isArray(members) && members.some((m: string) => old.states[m] !== this.hass.states[m]);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._clearTimers();
  }

  /* ------------------------------------------------------------------ render */

  protected render(): TemplateResult | typeof nothing {
    if (!this.hass || !this.cfg) return nothing;
    const m = (this._model = buildModel(this.hass, this.cfg, {
      useLightColor: this.opts.useLightColor,
      defaultAccent: this.opts.defaultAccent,
      mode: this._mode,
    }));

    let level = m.level;
    if (this._pending) {
      if (Date.now() > this._pending.until || Math.abs(this._pending.value - m.level) <= Math.max(1, m.snap)) {
        this._pending = null;
      } else level = this._pending.value;
    }
    if (this._drag !== null) level = this._drag;

    const dragging = this._drag !== null;
    const temp = this._mode === "temp";
    const on = m.on || (dragging && level > 0 && !temp) || (this._pending !== null && level > 0);
    const isSwitch = !m.draggable && m.toggleable;
    const fill = temp ? 100 : isSwitch ? (on ? 100 : 0) : on ? level : 0;

    const cls = [
      "slider",
      this.opts.style,
      on ? "on" : "off",
      isSwitch ? "switch" : "",
      m.unavailable ? "unavailable" : "",
      dragging ? "dragging" : "",
      temp ? "temp" : "",
      this.opts.glow ? "glow" : "",
    ].join(" ");

    const icon = html`<ha-state-icon
      class="icon"
      .hass=${this.hass}
      .stateObj=${m.stateObj}
      .icon=${this.cfg.icon}
    ></ha-state-icon>`;

    const fillEl = html`<div class="fill" style="height:${fill}%"></div>
      ${temp
        ? html`<div class="temp-track" style="background:${tempGradient(m.stateObj)}"></div>
            <div class="temp-mask" style="height:${100 - level}%"></div>`
        : nothing}`;

    const pct = html`<div class="pct">${m.format(level)}</div>`;
    const menu = this._menu ? this._renderMenu(m) : nothing;
    const style = `--svs-accent:${m.accent}`;

    if (this.opts.style === "column") {
      return html`<div class=${cls} style=${style}>
        <div class="name">${m.name}</div>
        <div
          class="track"
          @pointerdown=${(e: PointerEvent) => this._down(e, "track")}
          @pointermove=${this._move}
          @pointerup=${this._up}
          @pointercancel=${this._cancel}
          @contextmenu=${(e: Event) => e.preventDefault()}
        >
          ${fillEl} ${pct}
        </div>
        <div
          class="power"
          tabindex="0"
          role="button"
          aria-label=${m.name}
          @pointerdown=${(e: PointerEvent) => this._down(e, "power")}
          @pointerup=${this._up}
          @pointercancel=${this._cancel}
          @keydown=${this._key}
          @contextmenu=${(e: Event) => e.preventDefault()}
        >
          ${icon}
        </div>
        ${menu}
      </div>`;
    }

    return html`<div
      class=${cls}
      style=${style}
      tabindex="0"
      role="slider"
      aria-label=${m.name}
      aria-valuenow=${Math.round(level)}
      aria-valuemin="0"
      aria-valuemax="100"
      @pointerdown=${(e: PointerEvent) => this._down(e, "tile")}
      @pointermove=${this._move}
      @pointerup=${this._up}
      @pointercancel=${this._cancel}
      @keydown=${this._key}
      @contextmenu=${(e: Event) => e.preventDefault()}
    >
      ${fillEl}
      <div class="content">${icon}<div class="name">${m.name}</div></div>
      ${pct} ${menu}
    </div>`;
  }

  private _renderMenu(m: SliderModel): TemplateResult {
    const item = (icon: string, label: string, fn: () => void, active = false) =>
      html`<button class=${active ? "active" : ""} title=${label} aria-label=${label} @click=${fn}>
        <ha-icon .icon=${icon}></ha-icon>
      </button>`;
    return html`<div class="menu-backdrop" @pointerdown=${this._stop} @pointerup=${this._stop} @click=${this._closeMenu}>
      <div class="menu" @click=${this._stop}>
        ${item("mdi:brightness-6", "Brightness", () => this._setMode("level"), this._mode === "level")}
        ${m.supportsTemp
          ? item("mdi:thermometer", "Colour temperature", () => this._setMode("temp"), this._mode === "temp")
          : nothing}
        ${item("mdi:dots-horizontal", "More info", () => {
          this._menu = false;
          this._moreInfo();
        })}
      </div>
    </div>`;
  }

  /* ------------------------------------------------------------- interaction */
  /*
   * Touch:  quick tap = toggle · move first = page scroll (nothing happens)
   *         hold ~0.3 s still, then drag = dim · hold ~0.8 s still = menu / more-info
   * Mouse:  click = toggle · drag = dim right away · hold = menu / more-info
   */

  private _region: "tile" | "track" | "power" = "tile";
  /** Element the gesture started on (currentTarget is gone inside timers). */
  private _el?: HTMLElement;

  private _clearTimers(): void {
    clearTimeout(this._p.armTimer);
    clearTimeout(this._p.holdTimer);
  }

  private _down(e: PointerEvent, region: "tile" | "track" | "power"): void {
    const m = this._model;
    if (!m || this._menu || (e.pointerType === "mouse" && e.button !== 0)) return;
    this._clearTimers();
    const touch = e.pointerType !== "mouse";
    const shown = this._pending ? this._pending.value : m.level;
    this._region = region;
    this._el = e.currentTarget as HTMLElement;
    this._p = {
      id: e.pointerId,
      touch,
      x0: e.clientX,
      y0: e.clientY,
      start: this._mode === "temp" ? shown : m.on ? shown : 0,
      moved: false,
      armed: false,
      held: false,
      noTap: Date.now() - lastScroll < SCROLL_GRACE_MS,
      armTimer: 0,
      holdTimer: 0,
    };
    if (m.unavailable) {
      if (region !== "track") this._p.holdTimer = window.setTimeout(() => this._hold(), HOLD_MS);
      return;
    }
    const canDrag = m.draggable && region !== "power";
    if (!touch) {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      this._p.armed = canDrag;
      if (canDrag && region === "track" && this.opts.dragMode === "absolute") {
        this._p.moved = true;
        this._drag = this._absolute(e);
      }
    } else if (canDrag) {
      this._p.armTimer = window.setTimeout(() => this._arm(), ARM_MS);
    }
    if (region !== "track") this._p.holdTimer = window.setTimeout(() => this._hold(), HOLD_MS);
  }

  /** Touch held still long enough: from now on vertical movement dims. */
  private _arm(): void {
    const m = this._model;
    if (!m || this._p.id === -1 || this._p.moved) return;
    this._p.armed = true;
    this._haptic("light");
    try {
      this._el?.setPointerCapture(this._p.id);
    } catch {
      /* pointer already gone */
    }
    this._drag =
      this._region === "track" && this.opts.dragMode === "absolute" ? this._absoluteAt(this._p.y0) : this._p.start;
  }

  private _move = (e: PointerEvent): void => {
    const m = this._model;
    if (!m || e.pointerId !== this._p.id || this._p.held || this._region === "power") return;
    const dy = this._p.y0 - e.clientY;
    const dist = Math.max(Math.abs(dy), Math.abs(this._p.x0 - e.clientX));
    if (!this._p.armed) {
      // touch moved before arming: it's a page scroll, drop the gesture
      if (dist >= MOVE_PX) this._abort();
      return;
    }
    if (!this._p.moved) {
      if (dist < MOVE_PX) return;
      this._p.moved = true;
      clearTimeout(this._p.holdTimer);
    }
    e.preventDefault();
    if (this.opts.dragMode === "absolute") {
      this._drag = this._absolute(e);
    } else {
      const h = this._el?.getBoundingClientRect().height || 200;
      this._drag = Math.max(0, Math.min(100, this._p.start + (dy / h) * 100 * this.opts.sensitivity));
    }
  };

  private _up = (e: PointerEvent): void => {
    const m = this._model;
    if (!m || e.pointerId !== this._p.id) return;
    this._clearTimers();
    const { moved, armed, held, noTap } = this._p;
    this._p.id = -1;
    this._p.armed = false;
    if (held) {
      this._drag = null;
      return;
    }
    if (armed && moved && this._drag !== null) {
      const v = snapTo(this._drag, m.snap);
      this._drag = null;
      this._send(m, v);
      return;
    }
    this._drag = null;
    // armed but released without moving (touch held ~0.3-0.8 s): do nothing
    if (moved || noTap || (this._p.touch && armed) || m.unavailable) return;
    if (m.toggleable) {
      this._haptic("light");
      toggle(this.hass, m);
    } else this._moreInfo();
  };

  private _cancel = (): void => this._abort();

  private _abort(): void {
    this._clearTimers();
    this._p.id = -1;
    this._p.armed = false;
    this._drag = null;
  }

  private _hold(): void {
    const m = this._model;
    if (!m || this._p.id === -1 || this._p.moved) return;
    this._p.held = true;
    this._drag = null;
    this._haptic("medium");
    if (m.domain === "light" && m.supportsTemp && !m.unavailable) this._menu = true;
    else this._moreInfo();
  }

  private _key = (e: KeyboardEvent): void => {
    const m = this._model;
    if (!m || m.unavailable) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (m.toggleable) toggle(this.hass, m);
      else this._moreInfo();
    } else if ((e.key === "ArrowUp" || e.key === "ArrowDown") && m.draggable) {
      e.preventDefault();
      const cur = this._pending?.value ?? (m.on || this._mode === "temp" ? m.level : 0);
      const step = Math.max(5, m.snap);
      this._send(m, snapTo(cur + (e.key === "ArrowUp" ? step : -step), m.snap));
    }
  };

  private _absolute(e: PointerEvent): number {
    return this._absoluteAt(e.clientY);
  }

  private _absoluteAt(y: number): number {
    const r = this._el?.getBoundingClientRect();
    if (!r || !r.height) return this._p.start;
    return Math.max(0, Math.min(100, ((r.bottom - y) / r.height) * 100));
  }

  private _send(m: SliderModel, v: number): void {
    commitLevel(this.hass, m, v, this._mode, this.cfg);
    this._pending = { value: v, until: Date.now() + PENDING_MS };
    window.setTimeout(() => this.requestUpdate(), PENDING_MS + 50);
  }

  private _setMode(mode: SliderMode): void {
    this._mode = mode;
    this._menu = false;
    this._pending = null;
  }

  private _closeMenu = (e: Event): void => {
    e.stopPropagation();
    this._menu = false;
  };

  private _stop = (e: Event): void => e.stopPropagation();

  private _moreInfo(): void {
    fireEvent(this as any, "hass-more-info", { entityId: this.cfg.entity });
  }

  private _haptic(type: "light" | "medium"): void {
    fireEvent(window as any, "haptic" as any, type as any);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "svs-slider": SvsSlider;
  }
}
