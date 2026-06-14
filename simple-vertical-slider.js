class SimpleVerticalSlider extends HTMLElement {

  // ─── Config ───────────────────────────────────────────────────────────────

  setConfig(config) {
    if (!config) return;
    const entities = (config.entities || []).map(e => typeof e === 'string' ? { entity: e } : e);
    const prev = this._config;
    this._config = { ...config, entities };

    if (prev && this.content) {
      const prevIds = prev.entities.map(e => e.entity);
      const nextIds = entities.map(e => e.entity);
      if (prevIds.length !== nextIds.length || prevIds.some((id, i) => id !== nextIds[i])) {
        this.content = null;
        this._cols = [];
      }
    }

    if (this._hass && !this.content) this.hass = this._hass;
  }

  // ─── HASS setter ──────────────────────────────────────────────────────────

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;

    if (!this.content) {
      this.style.cssText = 'display:block;height:100%;min-height:0;align-self:stretch;margin:0;';
      this.innerHTML = `
        <ha-card style="background:none;border:none;box-shadow:none;padding:0;margin:0;height:100%;min-height:0;display:flex;flex-direction:column;box-sizing:border-box;">
          <div id="container" style="flex:1;min-height:0;display:flex;flex-direction:row;gap:10px;align-items:stretch;overflow-x:auto;padding:0 2px;box-sizing:border-box;"></div>
        </ha-card>`;
      this.content = this.querySelector('#container');
      this._cols = [];
      this._applyConfigVars();
      this._buildColumns(hass);
    } else {
      this._updateColumns(hass);
    }
  }

  // ─── CSS vars from YAML config ────────────────────────────────────────────

  _applyConfigVars() {
    const card = this.querySelector('ha-card');
    if (!card) return;
    const c = this._config;
    if (c.track_color) card.style.setProperty('--svs-track-color', c.track_color);
    if (c.fill_color)  card.style.setProperty('--svs-fill-color',  c.fill_color);
    if (c.column_bg)   card.style.setProperty('--svs-column-bg',   c.column_bg);
    if (c.card_height) card.style.height = c.card_height;
  }

  // ─── Build columns ────────────────────────────────────────────────────────

  _buildColumns(hass) {
    this._cols = [];
    this._config.entities.forEach((ent, idx) => {
      const stateObj = hass.states[ent.entity];
      if (!stateObj) { this._cols.push(null); return; }

      const state = this._getState(stateObj, ent);
      const refs  = this._makeColumn(stateObj, state, ent);
      this.content.appendChild(refs.el);
      this._cols.push(refs);

      if (!state.isUnavailable) {
        this._attachListeners(ent.entity, refs);
        this._attachPowerBtn(ent.entity, refs);
        if (state.isLight) this._attachModeMenu(idx, refs);
      }
    });
  }

  _makeColumn(stateObj, state, ent) {
    const {
      isOn, brightness, bulbColor, name,
      isSwitch, isFan, isNumber, isMediaPlayer, isLight, isUnavailable,
      supportsColor, supportsColorTemp, colorTempPct,
      numMin, numMax, numStep,
    } = state;

    const fillPct        = isOn ? brightness : 0;
    const ctGradient     = 'linear-gradient(to top, #ff8c00, #ffd27f, #fff5e0, #e8f0ff, #b3ccff)';
    const hasColorControl = isLight && (supportsColor || supportsColorTemp);

    let defaultIcon = 'mdi:power';
    if (isFan)          defaultIcon = 'mdi:fan';
    else if (isNumber)  defaultIcon = 'mdi:tune';
    else if (isMediaPlayer) defaultIcon = 'mdi:volume-high';
    const powerIcon = ent.icon || defaultIcon;

    const sliderCursor = isUnavailable ? 'not-allowed' : (isSwitch ? 'pointer' : 'ns-resize');
    const btnCursor    = isUnavailable ? 'not-allowed' : isNumber ? 'default' : 'pointer';

    const el = document.createElement('div');
    el.setAttribute('part', 'column');
    el.style.cssText = `display:flex;flex-direction:column;align-items:center;flex:1;min-width:80px;background:var(--svs-column-bg,#1a1a1a);padding:10px 5px 12px 5px;border-radius:35px;gap:10px;min-height:0;position:relative;${isUnavailable ? 'opacity:0.5;' : ''}`;

    el.innerHTML = `
      <div style="color:white;font-weight:600;font-size:13px;opacity:0.9;text-align:center;height:20px;overflow:hidden;pointer-events:none;">${name}</div>
      <div style="position:relative;flex:1;min-height:80px;width:75px;">
        <div class="slider-track" part="track" style="height:100%;width:100%;background:var(--svs-track-color,rgba(255,255,255,0.08));border-radius:25px;position:relative;overflow:hidden;cursor:${sliderCursor};touch-action:none;user-select:none;">
          <div class="slider-fill" part="fill" style="position:absolute;bottom:0;width:100%;height:${fillPct}%;background:${isOn ? `var(--svs-fill-color,${bulbColor})` : '#333'};transition:background 0.3s ease,height 0.3s ease;pointer-events:none;"></div>
        </div>
        <div class="slider-overlay" style="position:absolute;top:0;left:0;height:100%;width:100%;background:rgba(30,30,30,0.97);border-radius:25px;opacity:0;pointer-events:none;overflow:hidden;">
          <div class="overlay-fill" style="position:absolute;bottom:0;width:100%;height:0%;background:rgba(180,180,180,0.85);transition:none;pointer-events:none;"></div>
          <div class="overlay-pct" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10;color:white;font-weight:700;font-size:20px;text-shadow:0 1px 6px rgba(0,0,0,0.9);pointer-events:none;white-space:nowrap;">0%</div>
        </div>
      </div>
      <div style="position:relative;width:55px;height:55px;">
        <div class="power-btn" part="power-btn" style="width:55px;height:55px;border-radius:50%;background:${isOn ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)'};display:flex;align-items:center;justify-content:center;cursor:${btnCursor};border:1px solid rgba(255,255,255,0.05);">
          <ha-icon icon="${powerIcon}" style="color:${isOn ? bulbColor : '#666'};--mdc-icon-size:26px;pointer-events:none;"></ha-icon>
        </div>
        ${hasColorControl ? `
        <div class="mode-menu" style="display:none;position:absolute;bottom:62px;left:50%;transform:translateX(-50%);background:#222;border-radius:16px;padding:6px;flex-direction:column;gap:5px;z-index:20;box-shadow:0 4px 16px rgba(0,0,0,0.7);min-width:48px;align-items:center;">
          <div class="mode-btn" data-mode="brightness" title="Brightness" style="width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;background:rgba(255,255,255,0.07);">
            <ha-icon icon="mdi:brightness-6" style="--mdc-icon-size:22px;pointer-events:none;"></ha-icon>
          </div>
          <div class="mode-btn" data-mode="color" title="Color / Temp" style="width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;background:rgba(255,255,255,0.07);">
            <ha-icon icon="mdi:thermometer" style="--mdc-icon-size:22px;pointer-events:none;"></ha-icon>
          </div>
        </div>` : ''}
      </div>`;

    return {
      el,
      fill:              el.querySelector('.slider-fill'),
      overlay:           el.querySelector('.slider-overlay'),
      oFill:             el.querySelector('.overlay-fill'),
      oPct:              el.querySelector('.overlay-pct'),
      powerBtn:          el.querySelector('.power-btn'),
      powerIcon:         el.querySelector('.power-btn ha-icon'),
      modeMenu:          el.querySelector('.mode-menu') || null,
      track:             el.querySelector('.slider-track'),
      isDragging:        false,
      raf:               null,
      touchId:           null,
      dragValue:         -1,
      currentBrightness: fillPct,
      isSwitch, isFan, isNumber, isMediaPlayer, isLight, isUnavailable,
      sliderMode:        'brightness',
      supportsColor,
      supportsColorTemp,
      hasColorControl,
      colorTempMin:      stateObj.attributes.min_color_temp_kelvin || 2000,
      colorTempMax:      stateObj.attributes.max_color_temp_kelvin || 6500,
      ctGradient,
      numMin, numMax, numStep,
    };
  }

  // ─── State extraction ─────────────────────────────────────────────────────

  _getState(stateObj, ent) {
    const domain        = stateObj.entity_id.split('.')[0];
    const isUnavailable = stateObj.state === 'unavailable' || stateObj.state === 'unknown';
    const isSwitch      = domain === 'switch';
    const isFan         = domain === 'fan';
    const isNumber      = domain === 'number' || domain === 'input_number';
    const isMediaPlayer = domain === 'media_player';
    const isLight       = domain === 'light';
    const isOn          = !isUnavailable && stateObj.state === 'on';
    const name          = ent.name || stateObj.attributes.friendly_name || stateObj.entity_id;

    // Range for number/input_number; per-entity config overrides entity attributes
    const attrMin  = parseFloat(stateObj.attributes.min)  || 0;
    const attrMax  = parseFloat(stateObj.attributes.max)  || 100;
    const attrStep = parseFloat(stateObj.attributes.step) || 1;
    const numMin   = ent.min  != null ? parseFloat(ent.min)  : attrMin;
    const numMax   = ent.max  != null ? parseFloat(ent.max)  : attrMax;
    const numStep  = ent.step != null ? parseFloat(ent.step) : attrStep;

    let brightness = 0;
    if (!isUnavailable) {
      if (isSwitch) {
        brightness = isOn ? 100 : 0;
      } else if (isFan) {
        const pct = stateObj.attributes.percentage;
        brightness = pct != null ? Math.round(pct) : (isOn ? 100 : 0);
      } else if (isNumber) {
        const val = parseFloat(stateObj.state);
        brightness = Number.isFinite(val)
          ? Math.round(((val - numMin) / (numMax - numMin)) * 100)
          : 0;
      } else if (isMediaPlayer) {
        const vol = stateObj.attributes.volume_level;
        brightness = vol != null ? Math.round(vol * 100) : 0;
      } else {
        // light: brightness attr is 0-255; null when off
        const raw = stateObj.attributes.brightness;
        brightness = raw != null ? Math.round((raw / 255) * 100) : (isOn ? 100 : 0);
      }
    }
    brightness = Math.min(100, Math.max(0, brightness || 0));

    const supportedColorModes = stateObj.attributes.supported_color_modes || [];
    const supportsColorTemp   = supportedColorModes.includes('color_temp');
    const supportsColor       = supportedColorModes.some(m => ['rgb', 'rgbw', 'rgbww', 'hs', 'xy'].includes(m));

    let bulbColor = '#fdd835';
    if (isFan)          bulbColor = '#4fc3f7';
    else if (isMediaPlayer) bulbColor = '#7986cb';
    else if (isNumber)  bulbColor = '#81c784';
    if (isLight && isOn) {
      if (stateObj.attributes.rgb_color) {
        bulbColor = `rgb(${stateObj.attributes.rgb_color.join(',')})`;
      } else if (stateObj.attributes.color_temp_kelvin) {
        bulbColor = this._kelvinToColor(stateObj.attributes.color_temp_kelvin);
      }
    }

    let colorTempPct = null;
    if (supportsColorTemp && stateObj.attributes.color_temp_kelvin) {
      const minK = stateObj.attributes.min_color_temp_kelvin || 2000;
      const maxK = stateObj.attributes.max_color_temp_kelvin || 6500;
      colorTempPct = Math.round(((stateObj.attributes.color_temp_kelvin - minK) / (maxK - minK)) * 100);
    }

    return {
      isUnavailable, isOn, name, brightness, bulbColor,
      isSwitch, isFan, isNumber, isMediaPlayer, isLight,
      supportsColor, supportsColorTemp, colorTempPct,
      numMin, numMax, numStep,
    };
  }

  // ─── Service call dispatcher ──────────────────────────────────────────────

  _sendCmd(entityId, refs, pct) {
    if (refs.isUnavailable) return;
    const domain = entityId.split('.')[0];

    if (refs.isSwitch) {
      this._hass.callService(domain, pct >= 50 ? 'turn_on' : 'turn_off', { entity_id: entityId });
    } else if (refs.isFan) {
      if (pct > 0) {
        this._hass.callService('fan', 'turn_on', { entity_id: entityId, percentage: pct });
      } else {
        this._hass.callService('fan', 'turn_off', { entity_id: entityId });
      }
    } else if (refs.isNumber) {
      let val = refs.numMin + (pct / 100) * (refs.numMax - refs.numMin);
      if (refs.numStep > 0) val = Math.round(val / refs.numStep) * refs.numStep;
      val = parseFloat(Math.min(refs.numMax, Math.max(refs.numMin, val)).toFixed(6));
      this._hass.callService(domain, 'set_value', { entity_id: entityId, value: val });
    } else if (refs.isMediaPlayer) {
      this._hass.callService('media_player', 'volume_set', {
        entity_id:    entityId,
        volume_level: parseFloat((pct / 100).toFixed(2)),
      });
    } else if (refs.sliderMode === 'color') {
      this._sendColorCmd(entityId, refs, pct);
    } else if (pct > 0) {
      this._hass.callService('light', 'turn_on', { entity_id: entityId, brightness_pct: pct });
    } else {
      this._hass.callService('light', 'turn_off', { entity_id: entityId });
    }
  }

  // ─── Slider listeners (touch + mouse) ────────────────────────────────────

  _attachListeners(entityId, refs) {
    const track = refs.track;

    const calcPct = (clientY) => {
      const r = track.getBoundingClientRect();
      return Math.min(100, Math.max(0, Math.round(100 - ((clientY - r.top) / r.height) * 100)));
    };

    const setOverlayVisual = (pct) => {
      if (refs.raf) cancelAnimationFrame(refs.raf);
      refs.raf = requestAnimationFrame(() => {
        refs.oFill.style.height = `${pct}%`;
        refs.oPct.textContent   = `${pct}%`;
        refs.raf = null;
      });
    };

    const openOverlay = (clientY) => {
      const pct = calcPct(clientY);
      refs.dragValue = pct;
      refs.oFill.style.height = `${pct}%`;
      refs.oPct.textContent   = `${pct}%`;
      refs.overlay.style.opacity = '1';
      refs.isDragging = true;
    };

    const closeOverlay = (commit) => {
      if (!refs.isDragging) return;
      refs.isDragging = false;
      refs.touchId    = null;
      if (refs.raf) { cancelAnimationFrame(refs.raf); refs.raf = null; }
      refs.overlay.style.opacity = '0';
      if (commit && refs.dragValue >= 0) this._sendCmd(entityId, refs, refs.dragValue);
      refs.dragValue = -1;
    };

    const HOLD_DELAY = 200;

    // ── Touch ──────────────────────────────────────────────────────────────

    let holdTimer = null;
    let tapPct    = 0;

    const onTouchMove = (e) => {
      if (!refs.isDragging) return;
      const t = Array.from(e.touches).find(t => t.identifier === refs.touchId)
             || Array.from(e.changedTouches).find(t => t.identifier === refs.touchId);
      if (!t) return;
      if (e.cancelable) e.preventDefault();
      const pct = calcPct(t.clientY);
      if (pct !== refs.dragValue) { refs.dragValue = pct; setOverlayVisual(pct); }
    };

    const onTouchEnd = (e) => {
      if (!Array.from(e.changedTouches).find(t => t.identifier === refs.touchId)) return;
      removeTouchListeners();
      if (holdTimer !== null) {
        clearTimeout(holdTimer);
        holdTimer = null;
        this._sendCmd(entityId, refs, tapPct);
      } else if (refs.isSwitch) {
        this._sendCmd(entityId, refs, tapPct);
      } else {
        closeOverlay(true);
      }
    };

    const onTouchCancel = () => {
      clearTimeout(holdTimer);
      holdTimer = null;
      removeTouchListeners();
      closeOverlay(false);
    };

    const removeTouchListeners = () => {
      window.removeEventListener('touchmove',   onTouchMove);
      window.removeEventListener('touchend',    onTouchEnd);
      window.removeEventListener('touchcancel', onTouchCancel);
    };

    track.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      refs.touchId = touch.identifier;
      tapPct = calcPct(touch.clientY);

      if (!refs.isSwitch) {
        holdTimer = setTimeout(() => {
          holdTimer = null;
          openOverlay(touch.clientY);
        }, HOLD_DELAY);
      }

      window.addEventListener('touchmove',   onTouchMove,   { passive: false });
      window.addEventListener('touchend',    onTouchEnd);
      window.addEventListener('touchcancel', onTouchCancel);
    }, { passive: false });

    // ── Mouse ─────────────────────────────────────────────────────────────

    let mouseHoldTimer = null;
    let mouseTapPct    = 0;

    const onMouseMove = (e) => {
      if (!refs.isDragging) return;
      const pct = calcPct(e.clientY);
      if (pct !== refs.dragValue) { refs.dragValue = pct; setOverlayVisual(pct); }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
      if (mouseHoldTimer !== null) {
        clearTimeout(mouseHoldTimer);
        mouseHoldTimer = null;
        this._sendCmd(entityId, refs, mouseTapPct);
      } else if (refs.isSwitch) {
        this._sendCmd(entityId, refs, mouseTapPct);
      } else {
        closeOverlay(true);
      }
    };

    track.addEventListener('mousedown', (e) => {
      e.preventDefault();
      mouseTapPct = calcPct(e.clientY);

      if (!refs.isSwitch) {
        mouseHoldTimer = setTimeout(() => {
          mouseHoldTimer = null;
          openOverlay(e.clientY);
        }, HOLD_DELAY);
      }

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup',   onMouseUp);
    });
  }

  // ─── Power button ─────────────────────────────────────────────────────────

  _attachPowerBtn(entityId, refs) {
    if (refs.isNumber) return; // number entities have no toggle

    const POWER_HOLD = 600;
    let powerTimer = null;
    let powerMoved = false;

    const showMenu = () => {
      if (!refs.hasColorControl || !refs.modeMenu) return;
      refs.modeMenu.querySelectorAll('.mode-btn').forEach(b => {
        b.style.display = b.dataset.mode === refs.sliderMode ? 'none' : 'flex';
      });
      refs.modeMenu.style.display = 'flex';
    };

    const hideMenu = () => { if (refs.modeMenu) refs.modeMenu.style.display = 'none'; };

    const doToggle = () => {
      if (refs.isMediaPlayer) {
        const muted = this._hass.states[entityId]?.attributes.is_volume_muted;
        this._hass.callService('media_player', 'volume_mute', {
          entity_id: entityId,
          is_volume_muted: !muted,
        });
      } else {
        this._hass.callService(entityId.split('.')[0], 'toggle', { entity_id: entityId });
      }
    };

    refs.powerBtn.addEventListener('pointerdown', () => {
      powerMoved = false;
      powerTimer = setTimeout(() => { powerTimer = null; showMenu(); }, POWER_HOLD);
    });

    refs.powerBtn.addEventListener('pointermove', () => { powerMoved = true; });

    refs.powerBtn.addEventListener('pointerup', () => {
      if (powerTimer !== null) {
        clearTimeout(powerTimer);
        powerTimer = null;
        if (!powerMoved) { hideMenu(); doToggle(); }
      }
    });

    refs.powerBtn.addEventListener('pointerleave', () => {
      if (powerTimer !== null) { clearTimeout(powerTimer); powerTimer = null; }
    });

    document.addEventListener('pointerdown', (e) => {
      if (refs.modeMenu && refs.modeMenu.style.display !== 'none' &&
          !refs.modeMenu.contains(e.target) && e.target !== refs.powerBtn) {
        hideMenu();
      }
    });

    // Fallback for environments without PointerEvent
    if (!window.PointerEvent) {
      refs.powerBtn.addEventListener('touchstart', () => {
        powerMoved = false;
        powerTimer = setTimeout(() => { powerTimer = null; showMenu(); }, POWER_HOLD);
      }, { passive: true });

      refs.powerBtn.addEventListener('touchmove',  () => { powerMoved = true; }, { passive: true });

      refs.powerBtn.addEventListener('touchend', () => {
        if (powerTimer !== null) {
          clearTimeout(powerTimer);
          powerTimer = null;
          if (!powerMoved) { hideMenu(); doToggle(); }
        }
      });

      refs.powerBtn.addEventListener('click', () => doToggle());
    }
  }

  // ─── Mode menu (brightness / color temp) ─────────────────────────────────

  _attachModeMenu(idx, refs) {
    if (!refs.modeMenu) return;

    refs.modeMenu.addEventListener('pointerdown', (e) => e.stopPropagation());

    refs.modeMenu.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('pointerup', (e) => {
        e.stopPropagation();
        refs.sliderMode = btn.dataset.mode;
        refs.modeMenu.style.display = 'none';
        this._applySliderMode(this._config.entities[idx].entity, refs);
      });
    });
  }

  _applySliderMode(entityId, refs) {
    const stateObj = this._hass.states[entityId];
    if (!stateObj) return;
    const ent = this._config.entities.find(e => e.entity === entityId) || { entity: entityId };
    const { isOn, brightness, bulbColor, colorTempPct } = this._getState(stateObj, ent);

    if (refs.sliderMode === 'color') {
      refs.track.style.background = refs.ctGradient;
      refs.fill.style.transition  = 'none';
      refs.fill.style.position    = 'absolute';
      refs.fill.style.top         = '0';
      refs.fill.style.bottom      = 'unset';
      const pct = colorTempPct !== null ? colorTempPct : 50;
      refs.fill.style.height      = `${100 - pct}%`;
      refs.fill.style.background  = 'rgba(0,0,0,0.55)';
      refs.fill.style.width       = '100%';
      if (refs.oPct) refs.oPct.style.display = 'none';
    } else {
      refs.track.style.background = 'var(--svs-track-color,rgba(255,255,255,0.08))';
      refs.fill.style.position    = 'absolute';
      refs.fill.style.top         = 'unset';
      refs.fill.style.bottom      = '0';
      refs.fill.style.height      = `${isOn ? brightness : 0}%`;
      refs.fill.style.background  = isOn ? `var(--svs-fill-color,${bulbColor})` : '#333';
      refs.fill.style.transition  = 'background 0.3s ease,height 0.3s ease';
      if (refs.oPct) refs.oPct.style.display = '';
    }
  }

  _sendColorCmd(entityId, refs, pct) {
    if (refs.supportsColorTemp) {
      const kelvin = Math.round(refs.colorTempMin + (pct / 100) * (refs.colorTempMax - refs.colorTempMin));
      this._hass.callService('light', 'turn_on', { entity_id: entityId, color_temp_kelvin: kelvin });
    } else if (refs.supportsColor) {
      const hue = Math.round((pct / 100) * 360);
      this._hass.callService('light', 'turn_on', { entity_id: entityId, hs_color: [hue, 100] });
    }
  }

  // ─── Update columns on hass state change ─────────────────────────────────

  _updateColumns(hass) {
    this._config.entities.forEach((ent, idx) => {
      const refs = this._cols[idx];
      if (!refs || refs.isDragging) return;

      const stateObj = hass.states[ent.entity];
      if (!stateObj) return;

      const { isOn, brightness, bulbColor, colorTempPct, isUnavailable } = this._getState(stateObj, ent);
      const pct = isOn ? brightness : 0;

      refs.currentBrightness  = pct;
      refs.el.style.opacity   = isUnavailable ? '0.5' : '';

      if (refs.sliderMode === 'color') {
        const cp = colorTempPct !== null ? colorTempPct : 50;
        refs.fill.style.height = `${100 - cp}%`;
      } else {
        refs.fill.style.height     = `${pct}%`;
        refs.fill.style.background = isOn ? `var(--svs-fill-color,${bulbColor})` : '#333';
      }

      refs.powerBtn.style.background = isOn ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)';
      refs.powerIcon.style.color     = isOn ? bulbColor : '#666';
    });
  }

  // ─── Kelvin → RGB approximation ──────────────────────────────────────────

  _kelvinToColor(k) {
    k = Math.max(1000, Math.min(12000, k));
    let r, g, b;
    if (k <= 6600) {
      r = 255;
      g = Math.round(99.4708025861 * Math.log(k / 100) - 161.1195681661);
      b = k <= 2000 ? 0 : Math.round(138.5177312231 * Math.log(k / 100 - 10) - 305.0447927307);
    } else {
      r = Math.round(329.698727446  * Math.pow(k / 100 - 60, -0.1332047592));
      g = Math.round(288.1221695283 * Math.pow(k / 100 - 60, -0.0755148492));
      b = 255;
    }
    return `rgb(${Math.min(255,Math.max(0,r))},${Math.min(255,Math.max(0,g))},${Math.min(255,Math.max(0,b))})`;
  }

  // ─── Card registration helpers ────────────────────────────────────────────

  static getStubConfig() {
    return { entities: [{ entity: 'light.example' }] };
  }

  static getLayoutOptions() {
    return {
      grid_rows:        4,
      grid_columns:     2,
      grid_min_rows:    2,
      grid_max_rows:    12,
      grid_min_columns: 1,
      grid_max_columns: 12,
    };
  }

  static getConfigElement() {
    return document.createElement('simple-vertical-slider-editor');
  }
}

// ── Editor GUI ────────────────────────────────────────────────────────────────

class SimpleVerticalSliderEditor extends HTMLElement {
  connectedCallback() {
    this._tryRender();
  }

  set hass(hass) {
    this._hass = hass;
    this.querySelectorAll('ha-entity-picker').forEach(p => { p.hass = hass; });
    if (!this._rendered) this._tryRender();
  }

  setConfig(config) {
    if (!config) return;
    const oldCount = this._config ? this._config.entities.length : -1;
    try {
      this._config = JSON.parse(JSON.stringify(config));
    } catch (e) {
      this._config = { entities: [] };
    }
    if (!Array.isArray(this._config.entities)) this._config.entities = [];
    this._config.entities = this._config.entities.map(e =>
      !e ? { entity: '' } : typeof e === 'string' ? { entity: e } : e
    );

    if (!this._rendered) {
      this._tryRender();
    } else if (!this._firing) {
      const newCount = this._config.entities.length;
      if (newCount !== oldCount) {
        this._render();
      } else {
        this.querySelectorAll('ha-entity-picker').forEach((p, i) => {
          if (this._config.entities[i]) p.value = this._config.entities[i].entity || '';
        });
        this.querySelectorAll('input.svs-name').forEach((inp, i) => {
          if (this._config.entities[i]) inp.value = this._config.entities[i].name || '';
        });
      }
    }
  }

  _tryRender() {
    if (!this._config || !this._hass) return;
    if (this._rendered) return;
    this._rendered = true;
    this._renderAsync();
  }

  async _renderAsync() {
    if (!customElements.get('ha-entity-picker')) {
      await customElements.whenDefined('ha-entity-picker');
    }
    this._render();
  }

  _fire() {
    this._firing = true;
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail:   { config: this._config },
      bubbles:  true,
      composed: true,
    }));
    setTimeout(() => { this._firing = false; }, 200);
  }

  _render() {
    const entities = this._config.entities;
    this._rendered = true;

    this.innerHTML = `
      <style>
        .svs-editor { display:flex;flex-direction:column;gap:8px;padding:4px 0; }
        .svs-row { display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--secondary-background-color);border-radius:10px; }
        .svs-name { width:110px;padding:8px;border-radius:6px;font-size:13px;border:1px solid var(--divider-color);background:var(--card-background-color);color:var(--primary-text-color);flex-shrink:0;box-sizing:border-box; }
        .svs-btn { background:none;border:none;cursor:pointer;padding:4px;color:var(--secondary-text-color);border-radius:6px;display:flex;align-items:center;flex-shrink:0; }
        .svs-btn:hover { background:var(--divider-color); }
        .svs-btn.del:hover { color:var(--error-color,red); }
        .svs-btn:disabled { opacity:0.3;pointer-events:none; }
        .svs-add { width:100%;padding:10px;border-radius:10px;border:2px dashed var(--divider-color);background:none;cursor:pointer;font-size:13px;font-weight:600;color:var(--primary-color); }
        .svs-add:hover { background:var(--secondary-background-color); }
        ha-entity-picker { flex:1 1 auto;min-width:0;display:block; }
      </style>
      <div class="svs-editor">
        <div id="svs-list"></div>
        <button class="svs-add" id="svs-add">+ Add entity</button>
      </div>`;

    const list = this.querySelector('#svs-list');

    entities.forEach((ent, i) => {
      const row = document.createElement('div');
      row.className = 'svs-row';

      const picker = document.createElement('ha-entity-picker');
      picker.addEventListener('value-changed', (e) => {
        this._config.entities[i] = { ...this._config.entities[i], entity: e.detail.value };
        this._fire();
      });

      const nameInput = document.createElement('input');
      nameInput.className   = 'svs-name';
      nameInput.type        = 'text';
      nameInput.placeholder = 'Name (optional)';
      nameInput.value       = ent.name || '';
      nameInput.addEventListener('change', (e) => {
        const val     = e.target.value.trim();
        const updated = { ...this._config.entities[i] };
        if (val) updated.name = val; else delete updated.name;
        this._config.entities[i] = updated;
        this._fire();
      });

      const mkBtn = (svg, title, disabled) => {
        const b = document.createElement('button');
        b.className = 'svs-btn';
        b.title     = title;
        b.disabled  = !!disabled;
        b.innerHTML = svg;
        return b;
      };

      const upBtn = mkBtn('<svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M7 14l5-5 5 5H7z"/></svg>', 'Move up', i === 0);
      upBtn.addEventListener('click', () => {
        [this._config.entities[i-1], this._config.entities[i]] = [this._config.entities[i], this._config.entities[i-1]];
        this._render(); this._fire();
      });

      const downBtn = mkBtn('<svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M7 10l5 5 5-5H7z"/></svg>', 'Move down', i === entities.length - 1);
      downBtn.addEventListener('click', () => {
        [this._config.entities[i], this._config.entities[i+1]] = [this._config.entities[i+1], this._config.entities[i]];
        this._render(); this._fire();
      });

      const delBtn = mkBtn('<svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM15.5 4l-1-1h-5l-1 1H5v2h14V4h-3.5z"/></svg>', 'Delete');
      delBtn.className += ' del';
      delBtn.addEventListener('click', () => {
        this._config.entities.splice(i, 1);
        this._render(); this._fire();
      });

      row.appendChild(picker);
      row.appendChild(nameInput);
      row.appendChild(upBtn);
      row.appendChild(downBtn);
      row.appendChild(delBtn);
      list.appendChild(row);

      // Set picker properties after it's in DOM (Lit elements need connectedCallback)
      picker.hass              = this._hass;
      picker.value             = ent.entity || '';
      picker.label             = 'Entity';
      picker.includeDomains    = ['light', 'switch', 'fan', 'number', 'input_number', 'media_player'];
      picker.allowCustomEntity = false;
    });

    this.querySelector('#svs-add').addEventListener('click', () => {
      this._config.entities.push({ entity: '' });
      this._render(); this._fire();
    });
  }
}

customElements.define('simple-vertical-slider',        SimpleVerticalSlider);
customElements.define('simple-vertical-slider-editor', SimpleVerticalSliderEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type:        'simple-vertical-slider',
  name:        'Simple Vertical Slider',
  description: 'Vertical sliders for lights, fans, switches, media players and number entities',
  preview:     false,
});
