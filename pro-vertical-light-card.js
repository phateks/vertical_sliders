class ProVerticalLightCard extends HTMLElement {
  set hass(hass) {
    if (!this.content) {
      this.innerHTML = `
        <ha-card style="background: none; border: none; box-shadow: none;">
          <div id="container" style="display: flex; flex-direction: row; gap: 12px; justify-content: center; overflow-x: auto; padding: 10px 5px;"></div>
        </ha-card>
      `;
      this.content = this.querySelector("#container");
    }

    const config = this._config;
    this.content.innerHTML = "";

    config.entities.forEach((ent) => {
      const stateObj = hass.states[ent.entity];
      if (!stateObj) return;

      const isOn = stateObj.state === "on";
      const name = ent.name || stateObj.attributes.friendly_name || "Lumină";
      const brightness = stateObj.attributes.brightness ? Math.round((stateObj.attributes.brightness / 255) * 100) : 0;
      
      // Calculăm culoarea: dacă e Color Temp sau RGB, o preluăm, altfel galben standard
      let bulbColor = "#fdd835";
      if (isOn && stateObj.attributes.rgb_color) {
        bulbColor = `rgb(${stateObj.attributes.rgb_color.join(',')})`;
      }

      const column = document.createElement("div");
      column.style = `
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        width: 100px; 
        background: #1a1a1a; 
        padding: 15px 5px; 
        border-radius: 35px; 
        gap: 12px;
        flex-shrink: 0;
      `;
      
      column.innerHTML = `
        <div style="color: white; font-weight: 600; font-size: 13px; opacity: 0.9; text-align: center; height: 20px; overflow: hidden;">${name}</div>
        <div class="slider-track" style="height: 300px; width: 75px; background: rgba(255,255,255,0.08); border-radius: 25px; position: relative; overflow: hidden; cursor: ns-resize;">
          <div style="position: absolute; bottom: 0; width: 100%; height: ${isOn ? brightness : 0}%; background: ${isOn ? bulbColor : '#333'}; transition: height 0.2s ease, background 0.3s ease;"></div>
        </div>
        <div class="power-btn" style="width: 55px; height: 55px; border-radius: 50%; background: ${isOn ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)'}; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 1px solid rgba(255,255,255,0.05);">
          <ha-icon icon="mdi:power" style="color: ${isOn ? bulbColor : '#666'}; --mdc-icon-size: 26px;"></ha-icon>
        </div>
      `;

      // Event Listener pentru Toggle (On/Off)
      column.querySelector(".power-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        hass.callService("light", "toggle", { entity_id: ent.entity });
      });

      // Event Listener pentru Slider (Brightness)
      column.querySelector(".slider-track").addEventListener("click", (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const pct = Math.min(100, Math.max(0, Math.round(100 - (y / rect.height) * 100)));
        hass.callService("light", "turn_on", { 
          entity_id: ent.entity, 
          brightness_pct: pct 
        });
      });

      this.content.appendChild(column);
    });
  }

  setConfig(config) {
    if (!config.entities || !Array.isArray(config.entities)) {
      throw new Error("Definiți o listă de 'entities'!");
    }
    this._config = config;
  }

  getCardSize() {
    return 5;
  }
}

customElements.define("pro-vertical-light-card", ProVerticalLightCard);