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
          <div class="slider-track" data-entity="${ent.entity}" style="height: 100%; width: 100%; background: rgba(255,255,255,0.08); border-radius: 25px; position: relative; overflow: hidden; cursor: ns-resize; touch-action: pan-x pinch-zoom;">
            <div class="slider-fill" style="position: absolute; bottom: 0; width: 100%; height: ${isOn ? brightness : 0}%; background: ${isOn ? bulbColor : '#333'}; transition: background 0.3s ease, height 0.3s ease; pointer-events: none;"></div>
          </div>
          <div class="slider-overlay" style="position: absolute; top: 0; left: 0; height: 100%; width: 100%; background: rgba(255,255,255,0.15); border-radius: 25px; opacity: 0; pointer-events: none; transition: opacity 0.2s ease; display: flex; align-items: center; justify-content: center;">
            <div class="slider-overlay-fill" style="position: absolute; bottom: 0; width: 100%; height: 0%; background: ${bulbColor}; transition: none; pointer-events: none; border-radius: 25px;"></div>
            <div class="slider-percentage" style="position: relative; z-index: 10; color: white; font-weight: 700; font-size: 16px; text-shadow: 0 2px 4px rgba(0,0,0,0.5); pointer-events: none;">0%</div>
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

      const updateOverlay = (pct) => {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(() => {
          overlayFill.style.height = `${pct}%`;
          percentage.textContent = `${pct}%`;
          animationFrame = null;
        });
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

      // Pointer Events API cu setPointerCapture - nu mai poate fi "furat" de HA/browser
      track.addEventListener("pointerdown", (e) => {
        e.preventDefault();

        // Capturează pointer-ul pe acest element - nimeni nu-l mai poate fura
        try { track.setPointerCapture(e.pointerId); } catch (err) {}

        isDragging = true;
        const pct = calculatePercent(e.clientY);
        currentValue = pct;

        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'none';
        updateOverlay(pct);
      });

      track.addEventListener("pointermove", (e) => {
        if (!isDragging) return;
        e.preventDefault();

        const pct = calculatePercent(e.clientY);
        if (pct !== currentValue) {
          currentValue = pct;
          updateOverlay(pct);
        }
      });

      const onPointerEnd = (e) => {
        if (!isDragging) return;
        isDragging = false;

        try { track.releasePointerCapture(e.pointerId); } catch (err) {}

        overlay.style.opacity = '0';

        if (currentValue >= 0) {
          sendCommand(currentValue);
        }
        currentValue = -1;
      };

      track.addEventListener("pointerup", onPointerEnd);
      track.addEventListener("pointercancel", onPointerEnd);

      // Curățare
      column._cleanup = () => {
        if (animationFrame) cancelAnimationFrame(animationFrame);
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