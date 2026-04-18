class SimpleVerticalSlider extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
    if (!this._config) return; // setConfig nu a rulat inca

    if (!this.content) {
      // align-self:stretch — forteaza celula grid HA sa intinda cardul pe toata inaltimea alocata
      // margin:0 — elimina orice offset implicit de la HA
      this.style.cssText = 'display:block;height:100%;min-height:0;align-self:stretch;margin:0;';
      this.innerHTML = `
        <ha-card style="background:none;border:none;box-shadow:none;padding:0;margin:0;height:100%;min-height:0;display:flex;flex-direction:column;box-sizing:border-box;">
          <div id="container" style="flex:1;min-height:0;display:flex;flex-direction:row;gap:10px;align-items:stretch;overflow-x:auto;padding:0 2px;box-sizing:border-box;"></div>
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
      column.style.cssText = "display:flex;flex-direction:column;align-items:center;flex:1;min-width:80px;background:#1a1a1a;padding:10px 5px 12px 5px;border-radius:35px;gap:10px;min-height:0;";

      column.innerHTML = `
        <div style="color:white;font-weight:600;font-size:13px;opacity:0.9;text-align:center;height:20px;overflow:hidden;pointer-events:none;">${name}</div>
        <div style="position:relative;flex:1;min-height:80px;width:75px;">
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

  static getLayoutOptions() {
    return {
      grid_rows: 4,
      grid_columns: 2,
      grid_min_rows: 2,
      grid_max_rows: 12,
      grid_min_columns: 1,
      grid_max_columns: 12,
    };
  }

  static getConfigElement() {
    return document.createElement("simple-vertical-slider-editor");
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
    // _tryRender doar la primul render; nu reconstruim DOM-ul la fiecare update HA
    if (!this._rendered) this._tryRender();
  }

  setConfig(config) {
    if (!config) return;
    const oldCount = this._config ? this._config.entities.length : -1;
    // Deep copy + normalizare robusta
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
      // Prima initializare — randa cand hass e disponibil
      this._tryRender();
    } else if (!this._firing) {
      // Schimbare externa (ex: editare YAML manuala)
      const newCount = this._config.entities.length;
      if (newCount !== oldCount) {
        // Numar diferit de entitati — rebuild complet
        this._render();
      } else {
        // Acelasi numar — actualizam valorile existente fara rebuild
        this.querySelectorAll('ha-entity-picker').forEach((p, i) => {
          if (this._config.entities[i]) p.value = this._config.entities[i].entity || '';
        });
        this.querySelectorAll('input.svs-name').forEach((inp, i) => {
          if (this._config.entities[i]) inp.value = this._config.entities[i].name || '';
        });
      }
    }
    // Daca _firing == true: HA raspunde la propriul nostru _fire() — nu facem nimic cu DOM-ul
  }

  // Singura poarta: rendereaza NUMAI cand ambele _config si _hass sunt disponibile
  _tryRender() {
    if (!this._config || !this._hass) return;
    if (this._rendered) return;
    this._rendered = true; // seteaza inainte de await ca sa nu intre de 2 ori
    this._renderAsync();
  }

  async _renderAsync() {
    // Asteapta ca HA sa inregistreze ha-entity-picker (se incarca lazy)
    if (!customElements.get('ha-entity-picker')) {
      await customElements.whenDefined('ha-entity-picker');
    }
    this._render();
  }

  _fire() {
    this._firing = true;
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    }));
    // Timeout mai lung: HA poate apela setConfig async
    setTimeout(() => { this._firing = false; }, 200);
  }

  _render() {
    const entities = this._config.entities;
    this._rendered = true;

    this.innerHTML = `
      <style>
        .svs-editor { display: flex; flex-direction: column; gap: 8px; padding: 4px 0; }
        .svs-row { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--secondary-background-color); border-radius: 10px; }
        .svs-name { width: 110px; padding: 8px; border-radius: 6px; font-size: 13px; border: 1px solid var(--divider-color); background: var(--card-background-color); color: var(--primary-text-color); flex-shrink: 0; box-sizing: border-box; }
        .svs-btn { background: none; border: none; cursor: pointer; padding: 4px; color: var(--secondary-text-color); border-radius: 6px; display: flex; align-items: center; flex-shrink: 0; }
        .svs-btn:hover { background: var(--divider-color); }
        .svs-btn.del:hover { color: var(--error-color, red); }
        .svs-btn:disabled { opacity: 0.3; pointer-events: none; }
        .svs-add { width: 100%; padding: 10px; border-radius: 10px; border: 2px dashed var(--divider-color); background: none; cursor: pointer; font-size: 13px; font-weight: 600; color: var(--primary-color); }
        .svs-add:hover { background: var(--secondary-background-color); }
        ha-entity-picker { flex: 1 1 auto; min-width: 0; display: block; }
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

      const picker = document.createElement('ha-entity-picker');
      picker.addEventListener('value-changed', (e) => {
        this._config.entities[i] = { ...this._config.entities[i], entity: e.detail.value };
        this._fire();
      });

      const nameInput = document.createElement('input');
      nameInput.className = 'svs-name';
      nameInput.type = 'text';
      nameInput.placeholder = 'Name (optional)';
      nameInput.value = ent.name || '';
      nameInput.addEventListener('change', (e) => {
        const val = e.target.value.trim();
        const updated = { ...this._config.entities[i] };
        if (val) updated.name = val; else delete updated.name;
        this._config.entities[i] = updated;
        this._fire();
      });

      const mkBtn = (svg, title, disabled) => {
        const b = document.createElement('button');
        b.className = 'svs-btn';
        b.title = title;
        b.disabled = !!disabled;
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

      // Seteaza proprietatile picker-ului DUPA ce e in DOM (Lit elements au nevoie de connectCallback)
      picker.hass = this._hass;
      picker.value = ent.entity || '';
      picker.label = 'Light entity';
      picker.includeDomains = ['light'];
      picker.allowCustomEntity = false;
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
