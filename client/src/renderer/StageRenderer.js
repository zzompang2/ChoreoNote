import { STAGE_WIDTH, STAGE_HEIGHT, HALF_W, HALF_H, GRID_GAP, DANCER_RADIUS, clamp } from '../utils/constants.js';

export class StageRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = STAGE_WIDTH;
    this.canvas.height = STAGE_HEIGHT;

    // Offscreen canvas for grid cache
    this.gridCanvas = document.createElement('canvas');
    this.gridCanvas.width = STAGE_WIDTH;
    this.gridCanvas.height = STAGE_HEIGHT;
    this._drawGridCache();

    this.is3D = false;
    this.isSnap = false;
    this.showNames = true;

    // Drag state
    this._dragging = null; // { dancerIndex, startX, startY, offsetX, offsetY }
    this._boxSelect = null; // { startX, startY, endX, endY }
    this._selectedDancers = new Set();

    this._setupEvents();
  }

  // --- Grid Cache (drawn once) ---
  _drawGridCache() {
    const ctx = this.gridCanvas.getContext('2d');
    ctx.clearRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);

    // Grid lines
    for (let x = HALF_W % GRID_GAP; x < STAGE_WIDTH; x += GRID_GAP) {
      const isMajor = Math.round(Math.abs(x - HALF_W) / GRID_GAP) % 4 === 0;
      ctx.strokeStyle = isMajor ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)';
      ctx.lineWidth = isMajor ? 1 : 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, STAGE_HEIGHT);
      ctx.stroke();
    }
    for (let y = HALF_H % GRID_GAP; y < STAGE_HEIGHT; y += GRID_GAP) {
      const isMajor = Math.round(Math.abs(y - HALF_H) / GRID_GAP) % 4 === 0;
      ctx.strokeStyle = isMajor ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)';
      ctx.lineWidth = isMajor ? 1 : 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(STAGE_WIDTH, y);
      ctx.stroke();
    }

    // Center cross
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(HALF_W, 0);
    ctx.lineTo(HALF_W, STAGE_HEIGHT);
    ctx.moveTo(0, HALF_H);
    ctx.lineTo(STAGE_WIDTH, HALF_H);
    ctx.stroke();
  }

  // --- Main Draw ---
  drawFrame(dancers, positions) {
    const ctx = this.ctx;
    // Grid from cache
    ctx.drawImage(this.gridCanvas, 0, 0);

    // Draw dancers
    for (let i = 0; i < dancers.length; i++) {
      const d = dancers[i];
      const pos = positions[i];
      if (!pos) continue;

      let screenX = HALF_W + pos.x;
      let screenY = HALF_H + pos.y;
      let radius = DANCER_RADIUS;

      // 3D projection for video export
      if (this.is3D && this._projectionMode === 'render') {
        const projected = this._project3D(pos.x, pos.y);
        screenX = HALF_W + projected.x;
        screenY = HALF_H + projected.y;
        radius = DANCER_RADIUS * projected.scale;
      }

      const isSelected = this._selectedDancers.has(i);

      if (this.is3D) {
        // 3D mode: cylinder viewed from above
        // Bottom of cylinder = screenY (matches 2D circle position)
        const cylHeight = radius * 4.0;
        const ry = radius * 0.35;
        const topY = screenY - cylHeight; // top ellipse Y
        const botY = screenY;             // bottom ellipse Y = 2D position

        // Drop shadow
        ctx.beginPath();
        ctx.ellipse(screenX, botY + ry + 3, radius * 0.9, ry * 0.6, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fill();

        // Bottom ellipse (full)
        ctx.beginPath();
        ctx.ellipse(screenX, botY, radius, ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = darkenColor(d.color, 50);
        ctx.fill();

        // Cylinder body (side) with left-to-right gradient
        const bodyGrad = ctx.createLinearGradient(screenX - radius, 0, screenX + radius, 0);
        bodyGrad.addColorStop(0, darkenColor(d.color, 30));
        bodyGrad.addColorStop(0.3, lightenColor(d.color, 20));
        bodyGrad.addColorStop(0.5, lightenColor(d.color, 30));
        bodyGrad.addColorStop(0.7, lightenColor(d.color, 10));
        bodyGrad.addColorStop(1, darkenColor(d.color, 40));

        ctx.beginPath();
        ctx.rect(screenX - radius, topY, radius * 2, cylHeight);
        ctx.fillStyle = bodyGrad;
        ctx.fill();

        // Top ellipse (cap) with subtle gradient
        const topGrad = ctx.createRadialGradient(
          screenX - radius * 0.2, topY - ry * 0.3, radius * 0.1,
          screenX, topY, radius
        );
        topGrad.addColorStop(0, lightenColor(d.color, 40));
        topGrad.addColorStop(1, d.color);

        ctx.beginPath();
        ctx.ellipse(screenX, topY, radius, ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = topGrad;
        ctx.fill();

        // Rim highlight on top ellipse
        ctx.beginPath();
        ctx.ellipse(screenX, topY, radius, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = lightenColor(d.color, 30);
        ctx.lineWidth = 0.5;
        ctx.stroke();
      } else {
        // 2D mode: flat circle + subtle shadow
        ctx.beginPath();
        ctx.arc(screenX, screenY + 2, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
        ctx.fillStyle = d.color;
        ctx.fill();
      }

      if (isSelected) {
        if (this.is3D) {
          const ry = radius * 0.35;
          const topY = screenY - radius * 4.0;
          ctx.beginPath();
          ctx.ellipse(screenX, topY, radius + 2, ry + 2, 0, 0, Math.PI * 2);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Name/index label
      const label = this.showNames ? d.name.slice(0, 3) : String(i + 1);
      ctx.fillStyle = '#ffffff';
      const labelY = this.is3D ? screenY - radius * 4.0 : screenY;
      const fontSize = this.is3D ? Math.round(radius * 0.65) : Math.round(radius * 0.8);
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, screenX, labelY);
    }

    // Box selection rect
    if (this._boxSelect) {
      const { startX, startY, endX, endY } = this._boxSelect;
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(
        Math.min(startX, endX), Math.min(startY, endY),
        Math.abs(endX - startX), Math.abs(endY - startY)
      );
      ctx.setLineDash([]);
    }
  }

  // --- 3D Projection (for video export) ---
  _project3D(x, y) {
    const angle = 30 * (Math.PI / 180);
    const projectedY = y * Math.cos(angle);
    const depthFactor = 1 - (y / HALF_H) * 0.15;
    const scale = clamp(depthFactor, 0.7, 1.3);
    return { x: x * scale, y: projectedY, scale };
  }

  set3D(enabled, mode = 'css') {
    this.is3D = enabled;
    this._projectionMode = mode;
    if (mode === 'css') {
      this.canvas.style.transform = enabled
        ? 'perspective(800px) rotateX(30deg)'
        : '';
      this.canvas.style.transformOrigin = 'center center';
    }
  }

  // --- Hit Test ---
  hitTest(canvasX, canvasY, positions) {
    for (let i = positions.length - 1; i >= 0; i--) {
      const pos = positions[i];
      if (!pos) continue;
      const dx = (HALF_W + pos.x) - canvasX;
      const dy = (HALF_H + pos.y) - canvasY;
      if (dx * dx + dy * dy <= DANCER_RADIUS * DANCER_RADIUS) {
        return i;
      }
    }
    return -1;
  }

  // --- Mouse Events ---
  _setupEvents() {
    this.canvas.addEventListener('mousedown', (e) => this._onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this._onMouseUp(e));
  }

  _getCanvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (STAGE_WIDTH / rect.width),
      y: (e.clientY - rect.top) * (STAGE_HEIGHT / rect.height),
    };
  }

  _onMouseDown(e) {
    if (!this._positions || !this._dancers) return;
    const { x, y } = this._getCanvasPos(e);
    const hit = this.hitTest(x, y, this._positions);

    if (hit >= 0) {
      const pos = this._positions[hit];
      this._dragging = {
        dancerIndex: hit,
        startX: HALF_W + pos.x,
        startY: HALF_H + pos.y,
        offsetX: x - (HALF_W + pos.x),
        offsetY: y - (HALF_H + pos.y),
      };
      if (!this._selectedDancers.has(hit)) {
        if (!e.shiftKey) this._selectedDancers.clear();
        this._selectedDancers.add(hit);
      }
      this.onDancerSelect?.(hit);
    } else {
      this._selectedDancers.clear();
      this._boxSelect = { startX: x, startY: y, endX: x, endY: y };
      this.onDancerSelect?.(-1);
    }
  }

  _onMouseMove(e) {
    const { x, y } = this._getCanvasPos(e);

    if (this._dragging) {
      const newX = x - this._dragging.offsetX - HALF_W;
      const newY = y - this._dragging.offsetY - HALF_H;
      this.onDancerDrag?.(this._dragging.dancerIndex, newX, newY, this._selectedDancers);
    }

    if (this._boxSelect) {
      this._boxSelect.endX = x;
      this._boxSelect.endY = y;
    }
  }

  _onMouseUp(e) {
    if (this._dragging) {
      const { x, y } = this._getCanvasPos(e);
      const newX = x - this._dragging.offsetX - HALF_W;
      const newY = y - this._dragging.offsetY - HALF_H;
      this.onDancerDragEnd?.(this._dragging.dancerIndex, newX, newY, this._selectedDancers);
      this._dragging = null;
    }

    if (this._boxSelect) {
      this._selectDancersInBox();
      this._boxSelect = null;
    }
  }

  _selectDancersInBox() {
    if (!this._boxSelect || !this._positions) return;
    const { startX, startY, endX, endY } = this._boxSelect;
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);

    this._selectedDancers.clear();
    for (let i = 0; i < this._positions.length; i++) {
      const pos = this._positions[i];
      if (!pos) continue;
      const sx = HALF_W + pos.x;
      const sy = HALF_H + pos.y;
      if (sx >= minX && sx <= maxX && sy >= minY && sy <= maxY) {
        this._selectedDancers.add(i);
      }
    }
  }

  // Store current state for event handlers
  setCurrentState(dancers, positions) {
    this._dancers = dancers;
    this._positions = positions;
  }

  // Callbacks (set by App)
  onDancerSelect = null;
  onDancerDrag = null;
  onDancerDragEnd = null;
}

function parseColor(hex) {
  hex = hex.replace('#', '');
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  };
}

function toHex(r, g, b) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

function lightenColor(hex, amount) {
  const { r, g, b } = parseColor(hex);
  return toHex(r + amount, g + amount, b + amount);
}

function darkenColor(hex, amount) {
  const { r, g, b } = parseColor(hex);
  return toHex(r - amount, g - amount, b - amount);
}
