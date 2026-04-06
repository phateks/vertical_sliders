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
          <div class="slider-overlay" style="position: absolute; top: 0; left: 0; height: 100%; width: 100%; background: rgba(0,0,0,0.75); border-radius: 25px; opacity: 0; pointer-events: none; transition: opacity 0.15s ease; overflow: hidden;">
            <div class="slider-overlay-fill" style="position: absolute; bottom: 0; width: 100%; height: 0%; background: ${bulbColor}; transition: none; pointer-events: none;"></div>
            <div class="slider-percentage" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10; color: white; font-weight: 700; font-size: 18px; text-shadow: 0 1px 8px rgba(0,0,0,1), 0 0 12px rgba(0,0,0,0.8); pointer-events: none; white-space: nowrap;">0%</div>
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

      const listenerOpts = { passive: false };
      let dragStartTime = 0;
      const cancelGracePeriod = 150; // ms — ignoră pointercancel fals pe iOS

      const getClientY = (e) => {
        if (e.clientY !== undefined) return e.clientY;
        if (e.changedTouches && e.changedTouches[0]) return e.changedTouches[0].clientY;
        if (e.touches && e.touches[0]) return e.touches[0].clientY;
        return 0;
      };

      const releaseCaptureSafely = (e) => {
        if (typeof e?.pointerId !== 'number') return;
        try {
          if (track.hasPointerCapture && track.hasPointerCapture(e.pointerId)) {
            track.releasePointerCapture(e.pointerId);
          }
        } catch (_) {}
      };

      const attachListeners = () => {
        // Pe element (pentru captură directă)
        track.addEventListener('pointermove', onPointerMove, listenerOpts);
        track.addEventListener('touchmove', onPointerMove, listenerOpts);
        track.addEventListener('touchend', onPointerUp, listenerOpts);
        // Pe window (pentru când degetul iese din element)
        window.addEventListener('pointermove', onPointerMove, listenerOpts);
        window.addEventListener('pointerup', onPointerUp, listenerOpts);
        window.addEventListener('pointercancel', onPointerCancel, listenerOpts);
        window.addEventListener('touchmove', onPointerMove, listenerOpts);
        window.addEventListener('touchend', onPointerUp, listenerOpts);
        window.addEventListener('touchcancel', onPointerCancel, listenerOpts);
        window.addEventListener('blur', onPointerCancel);
      };

      const detachListeners = () => {
        track.removeEventListener('pointermove', onPointerMove, listenerOpts);
        track.removeEventListener('touchmove', onPointerMove, listenerOpts);
        track.removeEventListener('touchend', onPointerUp, listenerOpts);
        window.removeEventListener('pointermove', onPointerMove, listenerOpts);
        window.removeEventListener('pointerup', onPointerUp, listenerOpts);
        window.removeEventListener('pointercancel', onPointerCancel, listenerOpts);
        window.removeEventListener('touchmove', onPointerMove, listenerOpts);
        window.removeEventListener('touchend', onPointerUp, listenerOpts);
        window.removeEventListener('touchcancel', onPointerCancel, listenerOpts);
        window.removeEventListener('blur', onPointerCancel);
      };

      const onPointerMove = (e) => {
        if (!isDragging) return;
        if (e.touches && e.touches.length > 1) return; // ignoră pinch
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
        const pct = calculatePercent(getClientY(e));
        if (pct !== currentValue) {
          currentValue = pct;
          updateOverlay(pct);
        }
      };

      const onPointerUp = (e) => {
        if (!isDragging) return;
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        releaseCaptureSafely(e);
        isDragging = false;
        detachListeners();
        overlay.style.opacity = '0';
        if (currentValue >= 0) sendCommand(currentValue);
        currentValue = -1;
      };

      const onPointerCancel = (e) => {
        if (!isDragging) return;
        // Grace period: iOS trimite pointercancel fals imediat după start — ignoră-l
        if (Date.now() - dragStartTime < cancelGracePeriod) return;
        releaseCaptureSafely(e);
        isDragging = false;
        detachListeners();
        overlay.style.opacity = '0';
        currentValue = -1;
      };

      track.addEventListener('pointerdown', (e) => {
        try { track.setPointerCapture(e.pointerId); } catch (_) {}
        isDragging = true;
        dragStartTime = Date.now();
        const pct = calculatePercent(getClientY(e));
        currentValue = pct;
        overlay.style.opacity = '1';
        updateOverlay(pct);
        attachListeners();
      }, listenerOpts);

      // Curățare
      column._cleanup = () => {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        detachListeners();
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