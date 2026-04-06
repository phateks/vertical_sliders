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
        <div class="slider-track" data-entity="${ent.entity}" style="height: 300px; width: 75px; background: rgba(255,255,255,0.08); border-radius: 25px; position: relative; overflow: hidden; cursor: ns-resize; touch-action: pan-x pinch-zoom; transition: background 0.1s ease;">
          <div class="slider-fill" style="position: absolute; bottom: 0; width: 100%; height: ${isOn ? brightness : 0}%; background: ${isOn ? bulbColor : '#333'}; transition: background 0.3s ease; pointer-events: none;"></div>
        </div>
        <div class="power-btn" style="width: 55px; height: 55px; border-radius: 50%; background: ${isOn ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)'}; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 1px solid rgba(255,255,255,0.05);">
          <ha-icon icon="mdi:power" style="color: ${isOn ? bulbColor : '#666'}; --mdc-icon-size: 26px; pointer-events: none;"></ha-icon>
        </div>
      `;

      const track = column.querySelector(".slider-track");
      const fill = column.querySelector(".slider-fill");

      // Logica de Hold-to-Slide - exact ca Bubble Card pe mobil
      let isDragging = false;
      let isTouching = false;
      let lastValue = -1;
      let initialValue = -1;
      let animationFrame = null;
      let startY = 0;
      let lastY = 0;
      let dragStarted = false;
      let holdTimeout = null;
      const HOLD_DELAY = 200; // timpul de așteptare înainte să activăm slider-ul

      const updateVisual = (pct) => {
        fill.style.height = `${pct}%`;
        fill.style.background = pct > 0 ? bulbColor : '#333';
      };

      const sendCommand = (pct) => {
        if (pct > 0) {
          this._hass.callService("light", "turn_on", { 
            entity_id: ent.entity, 
            brightness_pct: pct 
          });
        }
      };

      const getClientY = (e) => {
        if (e.touches && e.touches[0]) return e.touches[0].clientY;
        if (e.changedTouches && e.changedTouches[0]) return e.changedTouches[0].clientY;
        return e.clientY;
      };

      const calculatePercent = (e) => {
        const rect = track.getBoundingClientRect();
        const clientY = getClientY(e);
        const y = clientY - rect.top;
        const rawPct = 100 - (y / rect.height) * 100;
        return Math.min(100, Math.max(0, Math.round(rawPct)));
      };

      const scheduleVisualUpdate = (pct) => {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(() => {
          updateVisual(pct);
          animationFrame = null;
        });
      };

      const activateDragging = () => {
        dragStarted = true;
        track.classList.remove('is-touching');
        track.classList.add('is-dragging');
        // Salvează valoarea inițială
        initialValue = lastValue;
      };

      const onStart = (e) => {
        isTouching = true;
        dragStarted = false;
        startY = getClientY(e);
        lastY = startY;
        
        // Calculează și salvează valoarea inițială
        const pct = calculatePercent(e);
        lastValue = pct;
        initialValue = pct;
        
        // Feedback vizual că ai atins
        track.classList.add('is-touching');
        
        // Pentru touch: activează dragging după un delay scurt ȘI mișcare
        if (e.type === 'touchstart') {
          holdTimeout = setTimeout(() => {
            if (isTouching && !dragStarted) {
              // Nu activăm automat, așteptăm mișcare
            }
          }, HOLD_DELAY);
        } else {
          // Pentru mouse: activează imediat
          dragStarted = true;
          track.classList.add('is-dragging');
        }
      };

      const onMove = (e) => {
        if (!isTouching) return;
        
        const currentY = getClientY(e);
        const deltaY = Math.abs(currentY - startY);
        
        // Pentru touch: activează dragging după mișcare > 5px
        if (!dragStarted && deltaY > 5) {
          if (holdTimeout) {
            clearTimeout(holdTimeout);
            holdTimeout = null;
          }
          activateDragging();
          if (e.cancelable) e.preventDefault();
        }
        
        // Actualizează vizual DOAR după ce dragging-ul a început
        if (dragStarted) {
          if (e.cancelable) e.preventDefault();
          
          const pct = calculatePercent(e);
          if (pct !== lastValue) {
            lastValue = pct;
            scheduleVisualUpdate(pct);
          }
        }
        
        lastY = currentY;
      };

      const onEnd = (e) => {
        if (!isTouching) return;
        
        if (holdTimeout) {
          clearTimeout(holdTimeout);
          holdTimeout = null;
        }
        
        isTouching = false;
        
        // Elimină clasele de feedback
        track.classList.remove('is-touching');
        track.classList.remove('is-dragging');
        
        if (dragStarted) {
          // Dragging efectiv → trimite valoarea finală
          if (lastValue >= 0 && lastValue !== initialValue) {
            sendCommand(lastValue);
          }
        } else {
          // Click/tap simplu → setează la poziția de click
          const pct = calculatePercent(e);
          scheduleVisualUpdate(pct);
          sendCommand(pct);
        }
        
        // Reset
        dragStarted = false;
        startY = 0;
        lastY = 0;
        initialValue = -1;
      };

      // Evenimente Mouse (desktop)
      track.addEventListener("mousedown", onStart, { passive: false });
      document.addEventListener("mousemove", onMove, { passive: false });
      document.addEventListener("mouseup", onEnd);

      // Evenimente Touch (mobil) - hold-to-slide behavior
      track.addEventListener("touchstart", onStart, { passive: false });
      document.addEventListener("touchmove", onMove, { passive: false });
      document.addEventListener("touchend", onEnd);
      document.addEventListener("touchcancel", onEnd);

      // Curățare evenimente când elementul este eliminat
      column._cleanup = () => {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        if (holdTimeout) clearTimeout(holdTimeout);
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onEnd);
        document.removeEventListener("touchmove", onMove);
        document.removeEventListener("touchend", onEnd);
        document.removeEventListener("touchcancel", onEnd);
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