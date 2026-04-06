class SimpleVerticalSlider extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
    if (!this._config) return; // setConfig nu a rulat inca

    if (!this.content) {
      this.innerHTML = `
        <ha-card style="background: none; border: none; box-shadow: none;">
          <div id="container" style="display: flex; flex-direction: row; gap: 12px; justify-content: center; overflow-x: auto; padding: 10px 5px;"></div>
        </ha-card>
      `;
      this.content = this.querySelector("#container");
      this._cols = {};
      this._buildColumns(hass);
    } else {
      this._updateColumns(hass);
    }
  }

  _buildColumns(hass) {
    this._config.entities.forEach((ent) => {
      // Suporta atat { entity: "..." } cat si string simplu
      const entityId = typeof ent === 'string' ? ent : ent.entity;
      const entObj = typeof ent === 'string' ? { entity: ent } : ent;
      const stateObj = hass.states[entityId];
      if (!stateObj) return;

      const { isOn, brightness, bulbColor, name } = this._getState(stateObj, entObj);

      const column = document.createElement("div");
      column.style.cssText = "display:flex;flex-direction:column;align-items:center;width:100px;background:#1a1a1a;padding:15px 5px;border-radius:35px;gap:12px;flex-shrink:0;";

      column.innerHTML = `
        <div style="color:white;font-weight:600;font-size:13px;opacity:0.9;text-align:center;height:20px;overflow:hidden;pointer-events:none;">${name}</div>
        <div style="position:relative;height:300px;width:75px;">
          <div class="slider-track" style="height:100%;width:100%;background:rgba(255,255,255,0.08);border-radius:25px;position:relative;overflow:hidden;cursor:ns-resize;touch-action:none;user-select:none;">
            <div class="slider-fill" style="position:absolute;bottom:0;width:100%;height:${isOn ? brightness : 0}%;background:${isOn ? bulbColor : '#333'};transition:background 0.3s ease,height 0.3s ease;pointer-events:none;"></div>
          </div>
          <div class="slider-overlay" style="position:absolute;top:0;left:0;height:100%;width:100%;background:rgba(30,30,30,0.97);border-radius:25px;opacity:0;pointer-events:none;overflow:hidden;">
            <div class="overlay-fill" style="position:absolute;bottom:0;width:100%;height:0%;background:rgba(180,180,180,0.85);transition:none;pointer-events:none;"></div>
            <div class="overlay-pct" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10;color:white;font-weight:700;font-size:20px;text-shadow:0 1px 6px rgba(0,0,0,0.9);pointer-events:none;white-space:nowrap;">0%</div>
          </div>
        </div>
        <div class="power-btn" style="width:55px;height:55px;border-radius:50%;background:${isOn ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)'};display:flex;align-items:center;justify-content:center;cursor:pointer;border:1px solid rgba(255,255,255,0.05);">
          <ha-icon icon="mdi:power" style="color:${isOn ? bulbColor : '#666'};--mdc-icon-size:26px;pointer-events:none;"></ha-icon>
        </div>
      `;

      this.content.appendChild(column);

      const refs = {
        fill:              column.querySelector(".slider-fill"),
        overlay:           column.querySelector(".slider-overlay"),
        oFill:             column.querySelector(".overlay-fill"),
        oPct:              column.querySelector(".overlay-pct"),
        powerBtn:          column.querySelector(".power-btn"),
        powerIcon:         column.querySelector("ha-icon"),
        track:             column.querySelector(".slider-track"),
        isDragging:        false,
        raf:               null,
        touchId:           null,
        dragValue:         -1,
        currentBrightness: isOn ? brightness : 0,
      };
      this._cols[entityId] = refs;

      this._attachListeners(entityId, refs);

      refs.powerBtn.addEventListener("click", () => {
        this._hass.callService("light", "toggle", { entity_id: entityId });
      });
    });
  }

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
        refs.oPct.textContent = `${pct}%`;
        refs.raf = null;
      });
    };

    const openOverlay = (clientY) => {
      // Porneste de la pozitia exacta a tapului/click-ului
      const pct = calcPct(clientY);
      refs.dragValue = pct;
      refs.oFill.style.height = `${pct}%`;
      refs.oPct.textContent = `${pct}%`;
      refs.overlay.style.opacity = '1';
      refs.isDragging = true;
    };

    const closeOverlay = (commit) => {
      if (!refs.isDragging) return;
      refs.isDragging = false;
      refs.touchId = null;
      if (refs.raf) { cancelAnimationFrame(refs.raf); refs.raf = null; }
      refs.overlay.style.opacity = '0';
      if (commit && refs.dragValue >= 0) {
        const pct = refs.dragValue;
        if (pct > 0) {
          this._hass.callService("light", "turn_on", { entity_id: entityId, brightness_pct: pct });
        } else {
          this._hass.callService("light", "turn_off", { entity_id: entityId });
        }
      }
      refs.dragValue = -1;
    };

    const HOLD_DELAY = 200; // ms — sub 200ms = tap, peste = hold cu overlay

    const sendDirect = (pct) => {
      if (pct > 0) {
        this._hass.callService("light", "turn_on", { entity_id: entityId, brightness_pct: pct });
      } else {
        this._hass.callService("light", "turn_off", { entity_id: entityId });
      }
    };

    // ── Touch (mobil) ─────────────────────────────────────────────────────

    let holdTimer = null;
    let tapPct = 0;

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
      if (holdTimer) {
        // Tap scurt — timer nu a apucat sa porneasca overlay-ul
        clearTimeout(holdTimer);
        holdTimer = null;
        sendDirect(tapPct);
      } else {
        // Hold — inchide overlay si trimite
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
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchCancel);
    };

    track.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      refs.touchId = touch.identifier;
      tapPct = calcPct(touch.clientY);

      // Incepe timer pentru hold — daca la 200ms inca tine apasat, deschide overlay
      holdTimer = setTimeout(() => {
        holdTimer = null;
        openOverlay(touch.clientY);
      }, HOLD_DELAY);

      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
      window.addEventListener('touchcancel', onTouchCancel);
    }, { passive: false });

    // ── Mouse (desktop) ───────────────────────────────────────────────────

    let mouseHoldTimer = null;
    let mouseTapPct = 0;

    const onMouseMove = (e) => {
      if (!refs.isDragging) return;
      const pct = calcPct(e.clientY);
      if (pct !== refs.dragValue) { refs.dragValue = pct; setOverlayVisual(pct); }
    };

    const onMouseUp = (e) => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (mouseHoldTimer) {
        clearTimeout(mouseHoldTimer);
        mouseHoldTimer = null;
        sendDirect(mouseTapPct);
      } else {
        closeOverlay(true);
      }
    };

    track.addEventListener('mousedown', (e) => {
      e.preventDefault();
      mouseTapPct = calcPct(e.clientY);

      mouseHoldTimer = setTimeout(() => {
        mouseHoldTimer = null;
        openOverlay(e.clientY);
      }, HOLD_DELAY);

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
  }

  _updateColumns(hass) {
    this._config.entities.forEach((ent) => {
      const entityId = typeof ent === 'string' ? ent : ent.entity;
      const entObj   = typeof ent === 'string' ? { entity: ent } : ent;
      const refs = this._cols[entityId];
      if (!refs) return;
      if (refs.isDragging) return;

      const stateObj = hass.states[entityId];
      if (!stateObj) return;

      const { isOn, brightness, bulbColor } = this._getState(stateObj, entObj);
      const pct = isOn ? brightness : 0;

      refs.currentBrightness = pct;
      refs.fill.style.height = `${pct}%`;
      refs.fill.style.background = isOn ? bulbColor : '#333';
      refs.powerBtn.style.background = isOn ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)';
      refs.powerIcon.style.color = isOn ? bulbColor : '#666';
    });
  }

  _getState(stateObj, ent) {
    const isOn = stateObj.state === "on";
    const name = ent.name || stateObj.attributes.friendly_name || "Lumina";
    const brightness = stateObj.attributes.brightness
      ? Math.round((stateObj.attributes.brightness / 255) * 100)
      : 0;
    let bulbColor = "#fdd835";
    if (isOn && stateObj.attributes.rgb_color) {
      bulbColor = `rgb(${stateObj.attributes.rgb_color.join(',')})`;
    }
    return { isOn, name, brightness, bulbColor };
  }

  setConfig(config) {
    if (!config) return;
    // Normalizeaza entities: accepta strings sau obiecte
    const raw = config.entities || [];
    this._config = {
      ...config,
      entities: raw.map(e => typeof e === 'string' ? { entity: e } : e)
    };
    // Reseteaza DOM daca lista de entitati s-a schimbat
    if (this.content && this._cols) {
      const cur = Object.keys(this._cols);
      const next = this._config.entities.map(e => e.entity);
      if (cur.length !== next.length || cur.some((e, i) => e !== next[i])) {
        this.content = null;
      }
    }
    // Daca hass e deja disponibil, triggereaza rebuild
    if (this._hass && !this.content) {
      this.hass = this._hass;
    }
  }

  static getStubConfig() {
    return { entities: [{ entity: "light.example" }] };
  }

  static getConfigElement() {
    return document.createElement("simple-vertical-slider-editor");
  }
}

// ── Editor GUI ────────────────────────────────────────────────────────────────

class SimpleVerticalSliderEditor extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
    // Actualizeaza hass pe toate picker-ele existente
    this.querySelectorAll('ha-entity-picker').forEach(p => { p.hass = hass; });
    if (!this._rendered) this._render();
  }

  setConfig(config) {
    if (!config) return;
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.entities) this._config.entities = [];
    if (this._rendered) this._render();
  }

  _fire() {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    }));
  }

  _render() {
    this._rendered = true;
    const entities = this._config.entities || [];

    // Wrapper cu stil
    this.innerHTML = `
      <style>
        .svs-editor { padding: 4px 0; }
        .svs-row {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 8px; padding: 8px 12px;
          background: var(--secondary-background-color); border-radius: 10px;
        }
        .svs-name {
          width: 100px; padding: 8px; border-radius: 6px; font-size: 13px;
          border: 1px solid var(--divider-color);
          background: var(--card-background-color);
          color: var(--primary-text-color);
          flex-shrink: 0;
        }
        .svs-btn {
          background: none; border: none; cursor: pointer; padding: 4px;
          color: var(--secondary-text-color); border-radius: 6px;
          display: flex; align-items: center; flex-shrink: 0;
        }
        .svs-btn:hover { background: var(--divider-color); }
        .svs-btn.del:hover { color: var(--error-color, red); }
        .svs-btn:disabled { opacity: 0.3; pointer-events: none; }
        .svs-add {
          width: 100%; padding: 10px; border-radius: 10px;
          border: 2px dashed var(--divider-color);
          background: none; cursor: pointer; font-size: 13px; font-weight: 600;
          color: var(--primary-color); margin-top: 4px;
        }
        .svs-add:hover { background: var(--secondary-background-color); }
        ha-entity-picker { flex: 1 1 auto; min-width: 0; }
      </style>
      <div class="svs-editor">
        <div id="svs-list"></div>
        <button class="svs-add" id="svs-add">+ Add light</button>
      </div>
    `;

    const list = this.querySelector('#svs-list');

    entities.forEach((ent, i) => {
      const row = document.createElement('div');
      row.className = 'svs-row';

      // ── Entity picker (creat imperativ — singura metoda fiabila) ──
      const picker = document.createElement('ha-entity-picker');
      picker.hass = this._hass;
      picker.value = ent.entity || '';
      picker.label = 'Light entity';
      picker.includeDomains = ['light'];
      picker.allowCustomEntity = false;
      picker.addEventListener('value-changed', (e) => {
        this._config.entities[i] = { ...this._config.entities[i], entity: e.detail.value };
        this._fire();
      });

      // ── Nume custom ──
      const nameInput = document.createElement('input');
      nameInput.className = 'svs-name';
      nameInput.type = 'text';
      nameInput.placeholder = 'Name (optional)';
      nameInput.value = ent.name || '';
      nameInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        const updated = { ...this._config.entities[i] };
        if (val) updated.name = val; else delete updated.name;
        this._config.entities[i] = updated;
        this._fire();
      });

      // ── Butoane ──
      const mkBtn = (svg, title, disabled) => {
        const b = document.createElement('button');
        b.className = 'svs-btn';
        b.title = title;
        b.disabled = disabled;
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

      const delBtn = mkBtn('<svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM15.5 4l-1-1h-5l-1 1H5v2h14V4h-3.5z"/></svg>', 'Delete', false);
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
    });

    this.querySelector('#svs-add').addEventListener('click', () => {
      this._config.entities.push({ entity: '' });
      this._render(); this._fire();
    });
  }
}

customElements.define("simple-vertical-slider", SimpleVerticalSlider);
customElements.define("simple-vertical-slider-editor", SimpleVerticalSliderEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "simple-vertical-slider",
  name: "Simple Vertical Slider",
  description: "Simple vertical brightness sliders",
  preview: false,
});
