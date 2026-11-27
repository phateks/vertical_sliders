import { css } from "lit";

/**
 * Card-level variables. They inherit into every slider, so a theme (or card-mod)
 * can override any of them on the card.
 */
export const cardStyles = css`
  :host {
    display: block;
    height: 100%;
    min-width: 0;
    --svs-txt: #e8eef6;
    --svs-surface: rgba(255, 255, 255, 0.06);
    --svs-surface-on: rgba(255, 255, 255, 0.05);
    --svs-off-border: 22%;
    --svs-off-icon: 55%;
    --svs-off-name: rgba(255, 255, 255, 0.75);
    --svs-on-name: rgba(255, 255, 255, 0.92);
    --svs-radius: 22px;
  }
  :host([light]) {
    --svs-txt: var(--primary-text-color, #1c2733);
    --svs-surface: rgba(30, 50, 80, 0.05);
    --svs-surface-on: rgba(30, 50, 80, 0.04);
    --svs-off-border: 40%;
    --svs-off-icon: 75%;
    --svs-off-name: var(--secondary-text-color, #5b6b7d);
    --svs-on-name: var(--primary-text-color, #1c2733);
  }
  ha-card {
    background: none;
    border: none;
    box-shadow: none;
    height: 100%;
    box-sizing: border-box;
    overflow: visible;
  }
  .grid {
    display: grid;
    height: 100%;
    box-sizing: border-box;
  }
  svs-slider {
    min-width: 0;
    min-height: 0;
  }
  .warning {
    padding: 12px;
    color: var(--error-color, #db4437);
    font-size: 13px;
  }
`;

export const sliderStyles = css`
  :host {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 0;
    /* masonry dashboards give no height: fall back to a tall tile */
    aspect-ratio: var(--svs-aspect, 0.62);
    -webkit-tap-highlight-color: transparent;
  }
  .slider {
    --a: var(--svs-accent, #ffcf8a);
    position: relative;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    color: var(--svs-txt);
    user-select: none;
    -webkit-user-select: none;
    outline: none;
  }

  /* ================================================================ TILE */
  .tile {
    container-type: size;
    overflow: hidden;
    cursor: pointer;
    /* the page may scroll over the tile; dimming starts only after a short hold */
    touch-action: pan-y;
    -webkit-touch-callout: none;
    border-radius: clamp(12px, 11cqmin, var(--svs-radius));
    background: var(--svs-surface);
    border: 1px solid color-mix(in srgb, var(--a) var(--svs-off-border), transparent);
    transition: border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
  }
  .tile:focus-visible {
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--a) 70%, transparent);
  }
  .tile.on {
    background: var(--svs-surface-on);
    border-color: color-mix(in srgb, var(--a) 55%, transparent);
  }
  .tile.on.glow {
    box-shadow: 0 0 22px color-mix(in srgb, var(--a) 18%, transparent);
  }

  /* fill: off = faint accent tint from the bottom (variant C), on = level */
  .fill {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    transition: height 0.3s ease, background 0.3s ease;
    background: linear-gradient(
      to top,
      color-mix(in srgb, var(--a) 55%, transparent),
      color-mix(in srgb, var(--a) 16%, transparent)
    );
  }
  .tile.off .fill {
    height: 100% !important;
    background: linear-gradient(to top, color-mix(in srgb, var(--a) 8%, transparent), transparent 60%);
  }
  .tile.switch.on .fill {
    background: color-mix(in srgb, var(--a) 22%, transparent);
  }
  .dragging .fill {
    transition: none;
  }

  .content {
    position: absolute;
    inset: 0;
    padding: clamp(8px, 9cqmin, 22px);
    display: grid;
    grid-template-rows: auto 1fr auto;
    grid-template-areas: "i" "." "n";
    pointer-events: none;
    min-width: 0;
  }
  .tile .icon {
    grid-area: i;
    --mdc-icon-size: clamp(18px, 30cqmin, 72px);
    width: var(--mdc-icon-size);
    height: var(--mdc-icon-size);
    color: color-mix(in srgb, var(--a) var(--svs-off-icon), transparent);
    transition: color 0.25s ease;
  }
  .tile.on .icon {
    color: var(--a);
  }
  .tile .name {
    grid-area: n;
    font-size: clamp(11px, 10cqmin, 22px);
    font-weight: 500;
    line-height: 1.2;
    color: var(--svs-off-name);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }
  .tile.on .name {
    color: var(--svs-on-name);
  }
  .tile .pct {
    position: absolute;
    right: clamp(8px, 9cqmin, 22px);
    top: clamp(8px, 9cqmin, 22px);
    font-size: clamp(12px, 14cqmin, 36px);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: #fff;
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.6);
    opacity: 0;
    transition: opacity 0.15s ease;
    pointer-events: none;
  }
  .dragging .pct {
    opacity: 1;
  }

  /* short tile: icon and name on one row */
  @container (max-height: 140px) {
    .content {
      padding: 0 clamp(10px, 18cqh, 22px);
      grid-template-columns: auto minmax(0, 1fr);
      grid-template-rows: 1fr;
      grid-template-areas: "i n";
      column-gap: clamp(8px, 16cqh, 18px);
      align-items: center;
    }
    .tile .icon {
      --mdc-icon-size: clamp(18px, 50cqh, 52px);
    }
    .tile .name {
      font-size: clamp(12px, 26cqh, 24px);
    }
    .tile .pct {
      top: 50%;
      bottom: auto;
      transform: translateY(-50%);
      right: clamp(10px, 18cqh, 22px);
      font-size: clamp(13px, 32cqh, 30px);
    }
  }
  /* very narrow tile: icon only, centred */
  @container (max-width: 70px) {
    .tile .name {
      display: none;
    }
    .content {
      justify-items: center;
    }
  }

  /* colour-temperature mode */
  .temp-track,
  .temp-mask {
    position: absolute;
    left: 0;
    right: 0;
    pointer-events: none;
  }
  .temp-track {
    inset: 0;
    opacity: 0.55;
  }
  .temp-mask {
    top: 0;
    background: rgba(10, 18, 30, 0.55);
    border-bottom: 2px solid rgba(255, 255, 255, 0.8);
  }
  .temp .fill {
    display: none;
  }

  .unavailable {
    opacity: 0.45;
    cursor: default;
  }

  /* ============================================================== COLUMN */
  .column {
    container-type: size;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(6px, 4cqh, 12px);
    padding: clamp(8px, 4cqh, 12px) 6px;
    border-radius: clamp(16px, 20cqw, 35px);
    background: var(--svs-surface);
    border: 1px solid color-mix(in srgb, var(--a) var(--svs-off-border), transparent);
  }
  .column .name {
    font-size: clamp(11px, 12cqw, 15px);
    font-weight: 500;
    color: var(--svs-off-name);
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .column.on .name {
    color: var(--svs-on-name);
  }
  .column .track {
    position: relative;
    flex: 1;
    min-height: 40px;
    width: min(75px, 78%);
    border-radius: clamp(12px, 18cqw, 25px);
    overflow: hidden;
    background: color-mix(in srgb, var(--a) 8%, rgba(255, 255, 255, 0.06));
    cursor: ns-resize;
    touch-action: pan-y;
  }
  .column.off .fill {
    height: 0 !important;
  }
  .column .pct {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: clamp(12px, 16cqw, 20px);
    font-weight: 600;
    color: #fff;
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.7);
    opacity: 0;
    pointer-events: none;
  }
  .column .power {
    flex: none;
    width: clamp(36px, 55cqw, 56px);
    height: clamp(36px, 55cqw, 56px);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.06);
    touch-action: manipulation;
  }
  .column.on .power {
    background: color-mix(in srgb, var(--a) 14%, transparent);
  }
  .column .icon {
    --mdc-icon-size: clamp(18px, 28cqw, 28px);
    color: color-mix(in srgb, var(--a) var(--svs-off-icon), transparent);
  }
  .column.on .icon {
    color: var(--a);
  }

  /* ================================================================ MENU */
  .menu-backdrop {
    position: absolute;
    inset: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(5, 12, 22, 0.35);
    border-radius: inherit;
  }
  .menu {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 6px;
    border-radius: 14px;
    background: #16243a;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5);
  }
  .menu button {
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.06);
    color: #dbe6f3;
    cursor: pointer;
    --mdc-icon-size: 22px;
  }
  .menu button.active {
    background: color-mix(in srgb, var(--a) 30%, transparent);
    color: #fff;
  }
`;
