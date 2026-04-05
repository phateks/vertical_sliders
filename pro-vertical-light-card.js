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
        <div class="slider-track" data-entity="${ent.entity}" style="height: 300px; width: 75px; background: rgba(255,255,255,0.08); border-radius: 25px; position: relative; overflow: hidden; cursor: ns-resize; touch-action: none;">
          <div class="slider-fill" style="position: absolute; bottom: 0; width: 100%; height: ${isOn ? brightness : 0}%; background: ${isOn ? bulbColor : '#333'}; transition: height 0.1s ease, background 0.3s ease; pointer-events: none;"></div>
        </div>
        <div class="power-btn" style="width: 55px; height: 55px; border-radius: 50%; background: ${isOn ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)'}; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 1px solid rgba(255,255,255,0.05);">
          <ha-icon icon="mdi:power" style="color: ${isOn ? bulbColor : '#666'}; --mdc-icon-size: 26px; pointer-events: none;"></ha-icon>
        </div>
      `;

      const track = column.querySelector(".slider-track");
      const fill = column.querySelector(".slider-fill");

      // Funcție pentru calcularea și trimiterea luminozității
      const updateBrightness = (e) => {
        const rect = track.getBoundingClientRect();
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const y = clientY - rect.top;
        const pct = Math.min(100, Math.max(0, Math.round(100 - (y / rect.height) * 100)));
        
        // Update vizual instantaneu pentru feedback fluid
        fill.style.height = `${pct}%`;
        
        this._hass.callService("light", "turn_on", { 
          entity_id: ent.entity, 
          brightness_pct: pct 
        });
      };

      // Logica de Slide (Drag)
      let isDragging = false;

      const startSlide = (e) => {
        isDragging = true;
        updateBrightness(e);
      };

      const moveSlide = (e) => {
        if (isDragging) updateBrightness(e);
      };

      const stopSlide = () => {
        isDragging = false;
      };

      // Evenimente Mouse
      track.addEventListener("mousedown", startSlide);
      window.addEventListener("mousemove", moveSlide);
      window.addEventListener("mouseup", stopSlide);

      // Evenimente Touch (Mobil)
      track.addEventListener("touchstart", startSlide, { passive: false });
      track.addEventListener("touchmove", moveSlide, { passive: false });
      track.addEventListener("touchend", stopSlide);

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