# Changelog

## [2.0.0] - 2026-11-27

Rewritten in Lit/TypeScript (same repo layout and release flow as Energy-Flow-card).
Replaces the `light_vslider` button-card template from the dobro dashboard.

### Added
- **Tile style** (default): the whole button is the slider. Tap toggles; hold and drag
  dims. Drag is relative to the current level by default (`drag_mode: absolute` for
  "level under the finger"); `sensitivity` for finer control. The percentage shows only
  while dragging.
- **Single or multiple sliders** in one card: `entity` or `entities`, `columns`, `gap`.
- **Auto-sizing**: icon, name, percentage, padding and corners scale with the slider's
  real size (container queries). Short sliders put icon and name on one row; very narrow
  ones show the icon only. Optional `width` / `height`; otherwise the dashboard grid decides.
- Per-slider **accent** colour, coloured border and glow when on (`glow`), light colour
  used as accent (`use_light_color`). Off sliders keep a faint tint of their accent so
  they stay visible on dark backgrounds.
- Hold menu on lights with colour temperature: brightness / colour temperature / more-info.
  Other entities: hold opens more-info.
- Light groups, fan `percentage_step`, number/input_number ranges, media player volume.
- The value sent is held on screen until Home Assistant reports it (no jump back).
- Keyboard: Enter toggles, arrow keys change the level.
- Light theme support; visual editor (single slider, layout, list of sliders).

### Kept
- **Column style** (`slider_style: column`): the v1 look with a track and a round power button.
- Element name `custom:simple-vertical-slider` and file name, so HACS updates in place.
- v1 options `card_height`, `fill_color`, `column_bg` still work.
