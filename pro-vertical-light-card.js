class ProVerticalLightCard extends HTMLElement {
  set hass(hass) {
    this._hass = hass;

    if (!this.content) {
      // Prima randare: construieste DOM si ataseaza listeners o singura data
      this.innerHTML = `
        <ha-card style="background: none; border: none; box-shadow: none;">
          <div id="container" style="display: flex; flex-direction: row; gap: 12px; justify-content: center; overflow-x: auto; padding: 10px 5px;"></div>
        </ha-card>
      `;
      this.content = this.querySelector("#container");
      this._cols = {};
      this._buildColumns(hass);
    } else {
      // Apeluri ulterioare: actualizeaza DOAR vizualul, NU reface DOM-ul
      this._updateColumns(hass);
    }
  }

  _buildColumns(hass) {
    this._config.entities.forEach((ent) => {
      const stateObj = hass.states[ent.entity];
      if (!stateObj) return;

      const { isOn, brightness, bulbColor, name } = this._getState(stateObj, ent);

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
      this._cols[ent.entity] = refs;

      this._attachListeners(ent.entity, refs);

      refs.powerBtn.addEventListener("click", () => {
        this._hass.callService("light", "toggle", { entity_id: ent.entity });
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
    // Ruleaza la fiecare apel hass — actualizeaza vizual fara a atinge DOM-ul
    this._config.entities.forEach((ent) => {
      const refs = this._cols[ent.entity];
      if (!refs) return;
      if (refs.isDragging) return; // utilizatorul trage — nu intrerupe

      const stateObj = hass.states[ent.entity];
      if (!stateObj) return;

      const { isOn, brightness, bulbColor } = this._getState(stateObj, ent);
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
    this._config = config;
  }

  static getStubConfig() {
    return { entities: [{ entity: "light.example" }] };
  }

  static getConfigElement() {
    return document.createElement("pro-vertical-light-card-editor");
  }
}

// ── Editor GUI ────────────────────────────────────────────────────────────────

class ProVerticalLightCardEditor extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
    if (!this._rendered) this._render();
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config)); // deep copy
    if (!this._config.entities) this._config.entities = [];
    if (this._rendered) this._render();
  }

  _fire() {
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    }));
  }

  _render() {
    this._rendered = true;
    const entities = this._config.entities || [];

    this.innerHTML = `
      <style>
        .pv-editor { padding: 8px 0; font-family: var(--primary-font-family, sans-serif); }
        .pv-editor h3 { margin: 0 0 12px; font-size: 14px; font-weight: 600; color: var(--primary-text-color); }
        .pv-entity-row {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 10px; background: var(--secondary-background-color, #f0f0f0);
          border-radius: 10px; padding: 10px 12px;
        }
        .pv-entity-row > * { flex-shrink: 0; }
        .pv-entity-row ha-entity-picker { flex: 1 1 auto; min-width: 0; }
        .pv-name-input {
          width: 90px; border: 1px solid var(--divider-color, #ccc);
          border-radius: 6px; padding: 6px 8px; font-size: 13px;
          background: var(--card-background-color, white);
          color: var(--primary-text-color, black);
        }
        .pv-icon-btn {
          background: none; border: none; cursor: pointer; padding: 4px;
          color: var(--secondary-text-color, #888); border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
        }
        .pv-icon-btn:hover { color: var(--primary-text-color); background: var(--divider-color, #eee); }
        .pv-icon-btn.del:hover { color: var(--error-color, #f44336); }
        .pv-add-btn {
          width: 100%; padding: 10px; border-radius: 10px; border: 2px dashed var(--divider-color, #ccc);
          background: none; cursor: pointer; font-size: 13px; font-weight: 600;
          color: var(--primary-color, #03a9f4); margin-top: 4px;
        }
        .pv-add-btn:hover { background: var(--secondary-background-color, #f0f0f0); }
        .pv-drag-handle { cursor: grab; color: var(--secondary-text-color, #aaa); }
      </style>
      <div class="pv-editor">
        <h3>Beculete</h3>
        <div id="pv-list">
          ${entities.map((ent, i) => this._rowHTML(ent, i)).join('')}
        </div>
        <button class="pv-add-btn" id="pv-add">+ Adauga bec</button>
      </div>
    `;

    // Adaugare entitate
    this.querySelector("#pv-add").addEventListener("click", () => {
      this._config.entities.push({ entity: "" });
      this._render();
      this._fire();
    });

    // Actiuni pe randuri
    this.querySelectorAll(".pv-row").forEach((row, i) => {
      // Entity picker nativ HA
      const picker = row.querySelector("ha-entity-picker");
      if (picker) {
        picker.hass = this._hass;
        picker.value = entities[i].entity || "";
        picker.includeDomains = ["light"];
        picker.allowCustomEntity = false;
        picker.addEventListener("value-changed", (e) => {
          this._config.entities[i].entity = e.detail.value;
          this._fire();
        });
      }

      // Nume custom
      const nameInput = row.querySelector(".pv-name-input");
      if (nameInput) {
        nameInput.addEventListener("input", (e) => {
          const val = e.target.value.trim();
          if (val) {
            this._config.entities[i].name = val;
          } else {
            delete this._config.entities[i].name;
          }
          this._fire();
        });
      }

      // Sterge
      row.querySelector(".pv-del").addEventListener("click", () => {
        this._config.entities.splice(i, 1);
        this._render();
        this._fire();
      });

      // Sus
      row.querySelector(".pv-up")?.addEventListener("click", () => {
        if (i === 0) return;
        [this._config.entities[i - 1], this._config.entities[i]] =
          [this._config.entities[i], this._config.entities[i - 1]];
        this._render();
        this._fire();
      });

      // Jos
      row.querySelector(".pv-down")?.addEventListener("click", () => {
        if (i === entities.length - 1) return;
        [this._config.entities[i], this._config.entities[i + 1]] =
          [this._config.entities[i + 1], this._config.entities[i]];
        this._render();
        this._fire();
      });
    });
  }

  _rowHTML(ent, i) {
    const total = (this._config.entities || []).length;
    return `
      <div class="pv-entity-row pv-row" data-index="${i}">
        <span class="pv-drag-handle">
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M3 15h18v-2H3v2zm0 4h18v-2H3v2zm0-8h18V9H3v2zm0-6v2h18V5H3z"/></svg>
        </span>
        <ha-entity-picker
          style="flex:1;min-width:0;"
          allow-custom-entity
        ></ha-entity-picker>
        <input
          class="pv-name-input"
          type="text"
          placeholder="Nume (optional)"
          value="${ent.name ? ent.name.replace(/"/g, '&quot;') : ''}"
        />
        <button class="pv-icon-btn pv-up" title="Muta sus" ${i === 0 ? 'disabled style="opacity:0.3"' : ''}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M7 14l5-5 5 5H7z"/></svg>
        </button>
        <button class="pv-icon-btn pv-down" title="Muta jos" ${i === total - 1 ? 'disabled style="opacity:0.3"' : ''}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M7 10l5 5 5-5H7z"/></svg>
        </button>
        <button class="pv-icon-btn del pv-del" title="Sterge">
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4h-3.5z"/></svg>
        </button>
      </div>
    `;
  }
}

customElements.define("pro-vertical-light-card-editor", ProVerticalLightCardEditor);
