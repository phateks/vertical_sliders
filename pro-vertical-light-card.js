class ProVerticalLightCard extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
    if (!this.content) {
      this.innerHTML = `
        <ha-card style="background: none; border: none; box-shadow: none;">
          <div id="container" style="display: flex; flex-direction: row; gap: 12px; justify-content: center; overflow-x: auto; padding: 10px 5px;"></div>
        </ha-card>
      `;
      this.content = this.querySelector("#container");
    }

    // Curățare event listeners anteriori
    if (this.content.children) {
      Array.from(this.content.children).forEach(child => {
        if (child._cleanup) child._cleanup();
      });
    }
    
    this.content.innerHTML = "";

    this._config.entities.forEach((ent) => {
      const stateObj = hass.states[ent.entity];
      if (!stateObj) return;

      const isOn = stateObj.state === "on";
      const name = ent.name || stateObj.attributes.friendly_name || "Lumină";
      const brightness = stateObj.attributes.brightness ? Math.round((stateObj.attributes.brightness / 255) * 100) : 0;
      
      let bulbColor = "#fdd835";
      if (isOn && stateObj.attributes.rgb_color) {
        bulbColor = `rgb(${stateObj.attributes.rgb_color.join(',')})`;
      }

      const column = document.createElement("div");
      column.style = "display: flex; flex-direction: column; align-items: center; width: 100px; background: #1a1a1a; padding: 15px 5px; border-radius: 35px; gap: 12px; flex-shrink: 0;";
      
      column.innerHTML = `
        <div style="color: white; font-weight: 600; font-size: 13px; opacity: 0.9; text-align: center; height: 20px; overflow: hidden; pointer-events: none;">${name}</div>
        <div class="slider-container" style="position: relative; height: 300px; width: 75px;">
          <div class="slider-track" data-entity="${ent.entity}" style="height: 100%; width: 100%; background: rgba(255,255,255,0.08); border-radius: 25px; position: relative; overflow: hidden; cursor: ns-resize; touch-action: none; user-select: none;">
            <div class="slider-fill" style="position: absolute; bottom: 0; width: 100%; height: ${isOn ? brightness : 0}%; background: ${isOn ? bulbColor : '#333'}; transition: background 0.3s ease, height 0.3s ease; pointer-events: none;"></div>
          </div>
          <div class="slider-overlay" style="position: absolute; top: 0; left: 0; height: 100%; width: 100%; background: rgba(40,40,40,0.96); border-radius: 25px; opacity: 0; pointer-events: none; transition: opacity 0.12s ease; overflow: hidden;">
            <div class="slider-overlay-fill" style="position: absolute; bottom: 0; width: 100%; height: 0%; background: rgba(160,160,160,0.75); transition: none; pointer-events: none;"></div>
            <div class="slider-percentage" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10; color: white; font-weight: 700; font-size: 20px; text-shadow: 0 1px 6px rgba(0,0,0,0.9); pointer-events: none; white-space: nowrap;">0%</div>
          </div>
        </div>
        <div class="power-btn" style="width: 55px; height: 55px; border-radius: 50%; background: ${isOn ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)'}; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 1px solid rgba(255,255,255,0.05);">
          <ha-icon icon="mdi:power" style="color: ${isOn ? bulbColor : '#666'}; --mdc-icon-size: 26px; pointer-events: none;"></ha-icon>
        </div>
      `;

      const track = column.querySelector(".slider-track");
      const fill = column.querySelector(".slider-fill");
      const overlay = column.querySelector(".slider-overlay");
      const overlayFill = column.querySelector(".slider-overlay-fill");
      const percentage = column.querySelector(".slider-percentage");

      let isDragging = false;
      let currentValue = -1;
      let animationFrame = null;
      let activeTouchId = null;

      // Valoarea curentă a entității (0 dacă e oprit)
      const entityBrightness = isOn ? brightness : 0;

      const updateOverlay = (pct) => {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(() => {
          overlayFill.style.height = `${pct}%`;
          percentage.textContent = `${Math.round(pct)}%`;
          animationFrame = null;
        });
      };

      const showOverlay = () => {
        // Overlay pornește întotdeauna de la valoarea curentă a becului
        currentValue = entityBrightness;
        overlayFill.style.height = `${entityBrightness}%`;
        percentage.textContent = `${entityBrightness}%`;
        overlay.style.opacity = '1';
        isDragging = true;
      };

      const hideOverlay = (sendCmd) => {
        if (!isDragging) return;
        isDragging = false;
        activeTouchId = null;
        if (animationFrame) { cancelAnimationFrame(animationFrame); animationFrame = null; }
        overlay.style.opacity = '0';
        if (sendCmd && currentValue >= 0) sendCommand(currentValue);
        currentValue = -1;
      };

      const sendCommand = (pct) => {
        if (pct > 0) {
          this._hass.callService("light", "turn_on", {
            entity_id: ent.entity,
            brightness_pct: pct
          });
        } else {
          this._hass.callService("light", "turn_off", {
            entity_id: ent.entity
          });
        }
      };

      const calculatePercent = (clientY) => {
        const rect = track.getBoundingClientRect();
        const y = clientY - rect.top;
        return Math.min(100, Math.max(0, Math.round(100 - (y / rect.height) * 100)));
      };

      // ── TOUCH (mobil) ──────────────────────────────────────────────────
      // touchstart cu preventDefault({ passive: false }) = browser-ul NU mai
      // interpretează gestul ca scroll => NICIUN pointercancel nu va fi emis
      const onTouchMove = (e) => {
        if (!isDragging) return;
        const t = Array.from(e.touches).find(t => t.identifier === activeTouchId)
               || Array.from(e.changedTouches).find(t => t.identifier === activeTouchId);
        if (!t) return;
        if (e.cancelable) e.preventDefault();
        const pct = calculatePercent(t.clientY);
        if (pct !== currentValue) { currentValue = pct; updateOverlay(pct); }
      };

      const onTouchEnd = (e) => {
        const t = Array.from(e.changedTouches).find(t => t.identifier === activeTouchId);
        if (!t) return;
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
        window.removeEventListener('touchcancel', onTouchCancel);
        hideOverlay(true);
      };

      const onTouchCancel = () => {
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
        window.removeEventListener('touchcancel', onTouchCancel);
        hideOverlay(true); // trimite și la cancel, nu reseta
      };

      track.addEventListener('touchstart', (e) => {
        // CRUCIAL: preventDefault pe touchstart oprește complet gestul de scroll
        // => browser-ul nu va emite pointercancel
        e.preventDefault();
        const touch = e.changedTouches[0];
        activeTouchId = touch.identifier;
        showOverlay();
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', onTouchEnd);
        window.addEventListener('touchcancel', onTouchCancel);
      }, { passive: false });

      // ── MOUSE (desktop) ────────────────────────────────────────────────
      const onMouseMove = (e) => {
        if (!isDragging) return;
        const pct = calculatePercent(e.clientY);
        if (pct !== currentValue) { currentValue = pct; updateOverlay(pct); }
      };

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        hideOverlay(true);
      };

      track.addEventListener('mousedown', (e) => {
        e.preventDefault();
        showOverlay();
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      });

      // Curățare la re-render
      column._cleanup = () => {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
        window.removeEventListener('touchcancel', onTouchCancel);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      // Power Button
      column.querySelector(".power-btn").addEventListener("click", () => {
        this._hass.callService("light", "toggle", { entity_id: ent.entity });
      });

      this.content.appendChild(column);
    });
  }

  setConfig(config) {
    this._config = config;
  }
}

customElements.define("pro-vertical-light-card", ProVerticalLightCard);