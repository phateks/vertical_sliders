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

    const openOverlay = () => {
      refs.dragValue = refs.currentBrightness;
      refs.oFill.style.height = `${refs.currentBrightness}%`;
      refs.oPct.textContent = `${refs.currentBrightness}%`;
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

    // ── Touch (mobil) ─────────────────────────────────────────────────────
    // preventDefault pe touchstart = browser NU mai interpreteaza ca scroll
    // => pointercancel nu va fi emis niciodata

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
      closeOverlay(true);
    };

    const onTouchCancel = () => { removeTouchListeners(); closeOverlay(true); };

    const removeTouchListeners = () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchCancel);
    };

    track.addEventListener('touchstart', (e) => {
      e.preventDefault();
      refs.touchId = e.changedTouches[0].identifier;
      openOverlay();
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
      window.addEventListener('touchcancel', onTouchCancel);
    }, { passive: false });

    // ── Mouse (desktop) ───────────────────────────────────────────────────

    const onMouseMove = (e) => {
      if (!refs.isDragging) return;
      const pct = calcPct(e.clientY);
      if (pct !== refs.dragValue) { refs.dragValue = pct; setOverlayVisual(pct); }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      closeOverlay(true);
    };

    track.addEventListener('mousedown', (e) => {
      e.preventDefault();
      openOverlay();
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
}

customElements.define("pro-vertical-light-card", ProVerticalLightCard);
