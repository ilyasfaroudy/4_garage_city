import { CITY, ORIGIN, METERS_PER_UNIT, buildNetworkMap, routePath } from './city.js';
import { clamp, escapeHtml, formatPrice, pad, reducedMotion } from './utils.js';

const MIN_ZOOM = 1;
const MAX_ZOOM = 2.6;
const ZOOM_STEP = 1.35;
const DRAG_THRESHOLD = 4;

const easeOut = (t) => 1 - Math.pow(1 - t, 4);

/**
 * SVG city scheme with an HTML marker overlay. The camera is a single
 * transform on the SVG group; markers are real <button>s positioned with
 * translate3d so they stay crisp and keyboard accessible at any zoom.
 */
export class CityMap {
  constructor(root, { onSelect, onHover }) {
    this.root = root;
    this.stage = root.querySelector('[data-map-stage]');
    this.svg = root.querySelector('[data-map-svg]');
    this.markerLayer = root.querySelector('[data-map-markers]');
    this.zoomReadout = root.querySelector('[data-map-zoom]');
    this.coordReadout = root.querySelector('[data-map-coords]');
    this.hint = root.querySelector('[data-map-hint]');
    this.onSelect = onSelect;
    this.onHover = onHover;

    this.size = { w: 1, h: 1 };
    this.base = 1;
    this.zoom = 1;
    this.t = { x: 0, y: 0 };
    this.markers = new Map();
    this.pointers = new Map();
    this.drag = null;
    this.parallax = { x: 0, y: 0, tx: 0, ty: 0 };
    this.frame = null;
    this.animation = null;
    this.selectedId = null;
    this.inset = { right: 0, bottom: 0 };

    const refs = buildNetworkMap(this.svg);
    Object.assign(this, refs);

    this.bindEvents();
    this.observeSize();
  }

  get scale() {
    return this.base * this.zoom;
  }

  /* ------------------------------------------------------------ markers */

  setSpaces(spaces) {
    this.markerLayer.innerHTML = '';
    this.markers.clear();
    spaces.forEach((space) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'marker';
      button.dataset.id = space.id;
      button.dataset.cursor = 'select';
      button.innerHTML = `
        <span class="marker__anchor" aria-hidden="true"></span>
        <span class="marker__tag">
          <span class="marker__code">${space.code}</span>
          <span class="marker__more">
            <span class="marker__name">${escapeHtml(space.name)}</span>
            <span class="marker__status"></span>
            <span class="marker__rate">${formatPrice(space.pricePerHour)} / H</span>
          </span>
        </span>
        <span class="marker__pass" aria-hidden="true">PASS</span>`;
      this.markerLayer.append(button);
      this.markers.set(space.id, { el: button, space, status: button.querySelector('.marker__status') });
    });
    this.positionMarkers();
  }

  update({ visibleIds, availability, selectedId }) {
    this.selectedId = selectedId && visibleIds.has(selectedId) ? selectedId : null;
    this.markers.forEach(({ el, space, status }, id) => {
      const av = availability.get(id);
      const visible = visibleIds.has(id);
      el.hidden = !visible;
      el.dataset.state = av.state;
      el.classList.toggle('is-active', id === this.selectedId);
      el.classList.toggle('has-pass', av.hasPass);
      el.setAttribute('aria-pressed', String(id === this.selectedId));
      status.textContent = av.label;
      el.setAttribute('aria-label', `${space.code} ${space.name}, ${space.district}. ${av.label}${av.hasPass ? '. Есть ваша бронь' : ''}`);
    });
    this.drawRoute();
  }

  setHover(id) {
    this.markers.forEach(({ el }, markerId) => el.classList.toggle('is-hover', markerId === id));
  }

  drawRoute() {
    const entry = this.selectedId ? this.markers.get(this.selectedId) : null;
    if (!entry) {
      this.route.setAttribute('d', '');
      this.route.classList.remove('is-drawn');
      this.routeLabel.hidden = true;
      return;
    }
    const { d, length, mid } = routePath(ORIGIN, entry.space.coordinates);
    if (this.route.getAttribute('d') === d) return;
    const km = (length * METERS_PER_UNIT) / 1000;
    const minutes = Math.max(4, Math.round(km * 3.2 + 2));
    this.route.setAttribute('d', d);
    this.route.classList.remove('is-drawn');
    // Restart the line-draw transition on the next frame.
    requestAnimationFrame(() => requestAnimationFrame(() => this.route.classList.add('is-drawn')));
    this.routeLabel.hidden = false;
    this.routeLabel.setAttribute('transform', `translate(${mid.x + 10} ${mid.y - 8})`);
    this.routeLabel.querySelector('text').textContent = `≈ ${km.toFixed(1)} KM · ${pad(minutes)} MIN`;
  }

  positionMarkers() {
    const s = this.scale;
    this.markers.forEach(({ el, space }) => {
      const x = space.coordinates.x * s + this.t.x;
      const y = space.coordinates.y * s + this.t.y;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    });
  }

  /* ------------------------------------------------------------- camera */

  observeSize() {
    const resize = () => {
      const rect = this.stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const center = this.size.w > 1 ? this.screenToWorld(this.size.w / 2, this.size.h / 2) : null;
      this.size = { w: rect.width, h: rect.height };
      this.base = Math.max(rect.width / CITY.w, rect.height / CITY.h);
      if (center) this.centerOn(center, this.zoom, false);
      else this.reset(false);
    };
    new ResizeObserver(resize).observe(this.stage);
    resize();
  }

  screenToWorld(x, y) {
    return { x: (x - this.t.x) / this.scale, y: (y - this.t.y) / this.scale };
  }

  // Panels covering part of the map (drawer, bottom sheet) extend the pan range
  // so that edge markers can still be brought into the visible area.
  clampTranslate(t, scale) {
    const mw = CITY.w * scale;
    const mh = CITY.h * scale;
    const { w, h } = this.size;
    const { right, bottom } = this.inset;
    return {
      x: mw <= w ? (w - mw) / 2 : clamp(t.x, w - mw - right, 0),
      y: mh <= h ? (h - mh) / 2 : clamp(t.y, h - mh - bottom, 0),
    };
  }

  setInset(inset) {
    this.inset = { right: inset.right || 0, bottom: inset.bottom || 0 };
    if (!inset.right && !inset.bottom) this.animateTo(this.t, this.zoom, 500);
  }

  apply() {
    const s = this.scale;
    this.camera.setAttribute('transform', `translate(${this.t.x.toFixed(2)} ${this.t.y.toFixed(2)}) scale(${s.toFixed(4)})`);
    this.positionMarkers();
    if (this.zoomReadout) this.zoomReadout.textContent = `Z ${this.zoom.toFixed(2)}`;
    this.root.style.setProperty('--map-zoom', this.zoom.toFixed(3));
  }

  setCamera(t, zoom) {
    this.zoom = clamp(zoom, MIN_ZOOM, MAX_ZOOM);
    this.t = this.clampTranslate(t, this.scale);
    this.apply();
  }

  animateTo(t, zoom, duration = 700) {
    cancelAnimationFrame(this.animation);
    const targetZoom = clamp(zoom, MIN_ZOOM, MAX_ZOOM);
    const target = this.clampTranslate(t, this.base * targetZoom);
    if (reducedMotion() || duration === 0) {
      this.setCamera(target, targetZoom);
      return;
    }
    const from = { ...this.t, zoom: this.zoom };
    const start = performance.now();
    const step = (now) => {
      const p = easeOut(Math.min(1, (now - start) / duration));
      this.zoom = from.zoom + (targetZoom - from.zoom) * p;
      this.t = {
        x: from.x + (target.x - from.x) * p,
        y: from.y + (target.y - from.y) * p,
      };
      this.apply();
      if (p < 1) this.animation = requestAnimationFrame(step);
    };
    this.animation = requestAnimationFrame(step);
  }

  centerOn(point, zoom = this.zoom, animate = true, inset = { right: 0, bottom: 0 }) {
    const scale = this.base * clamp(zoom, MIN_ZOOM, MAX_ZOOM);
    const vw = this.size.w - inset.right;
    const vh = this.size.h - inset.bottom;
    const t = { x: vw / 2 - point.x * scale, y: vh / 2 - point.y * scale };
    if (animate) this.animateTo(t, zoom);
    else this.setCamera(t, zoom);
  }

  zoomAt(factor, sx = this.size.w / 2, sy = this.size.h / 2, animate = true) {
    const zoom = clamp(this.zoom * factor, MIN_ZOOM, MAX_ZOOM);
    const world = this.screenToWorld(sx, sy);
    const scale = this.base * zoom;
    const t = { x: sx - world.x * scale, y: sy - world.y * scale };
    if (animate) this.animateTo(t, zoom, 420);
    else this.setCamera(t, zoom);
  }

  zoomIn() { this.zoomAt(ZOOM_STEP); }
  zoomOut() { this.zoomAt(1 / ZOOM_STEP); }

  reset(animate = true) {
    this.centerOn({ x: 820, y: 500 }, 1, animate);
  }

  /** Brings a space into the visible part of the map (ignoring covered insets). */
  reveal(id, inset = { right: 0, bottom: 0 }) {
    const entry = this.markers.get(id);
    if (!entry) return;
    this.setInset(inset);
    const { x, y } = entry.space.coordinates;
    const sx = x * this.scale + this.t.x;
    const sy = y * this.scale + this.t.y;
    const pad = 80;
    const inside = sx > pad && sx < this.size.w - inset.right - pad * 2 && sy > pad && sy < this.size.h - inset.bottom - pad;
    if (!inside) this.centerOn({ x, y }, Math.max(this.zoom, 1.25), true, inset);
  }

  /* ------------------------------------------------------------- events */

  bindEvents() {
    this.markerLayer.addEventListener('click', (event) => {
      const marker = event.target.closest('.marker');
      if (marker && !this.drag?.moved) this.onSelect(marker.dataset.id);
    });
    const hoverHandler = (event) => {
      const marker = event.target.closest('.marker');
      this.onHover(event.type === 'pointerover' || event.type === 'focusin' ? marker?.dataset.id ?? null : null);
    };
    this.markerLayer.addEventListener('pointerover', hoverHandler);
    this.markerLayer.addEventListener('pointerout', hoverHandler);
    this.markerLayer.addEventListener('focusin', hoverHandler);
    this.markerLayer.addEventListener('focusout', hoverHandler);

    this.stage.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    this.stage.addEventListener('pointermove', (e) => this.onPointerMove(e));
    this.stage.addEventListener('pointerup', (e) => this.onPointerUp(e));
    this.stage.addEventListener('pointercancel', (e) => this.onPointerUp(e));
    this.stage.addEventListener('pointerleave', () => {
      this.parallax.tx = 0;
      this.parallax.ty = 0;
      this.schedule();
    });
    this.stage.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    this.stage.addEventListener('keydown', (e) => this.onKey(e));

    this.root.addEventListener('click', (event) => {
      const action = event.target.closest('[data-map-action]')?.dataset.mapAction;
      if (action === 'zoom-in') this.zoomIn();
      if (action === 'zoom-out') this.zoomOut();
      if (action === 'reset') this.reset();
    });
  }

  onPointerDown(event) {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    if (event.target.closest('.marker, .map__ui')) return;
    cancelAnimationFrame(this.animation);
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    this.stage.setPointerCapture(event.pointerId);
    if (this.pointers.size === 1) {
      this.drag = { x: event.clientX, y: event.clientY, t: { ...this.t }, moved: false };
    } else if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      this.pinch = { distance: Math.hypot(a.x - b.x, a.y - b.y), zoom: this.zoom };
    }
  }

  onPointerMove(event) {
    const rect = this.stage.getBoundingClientRect();
    const sx = event.clientX - rect.left;
    const sy = event.clientY - rect.top;

    if (this.coordReadout) {
      const world = this.screenToWorld(sx, sy);
      this.coordReadout.textContent = `X ${pad(Math.round(clamp(world.x, 0, CITY.w)), 4)} · Y ${pad(Math.round(clamp(world.y, 0, CITY.h)), 4)}`;
    }

    if (!this.pointers.has(event.pointerId)) {
      if (event.pointerType === 'mouse') {
        this.parallax.tx = sx / this.size.w - 0.5;
        this.parallax.ty = sy / this.size.h - 0.5;
        this.schedule();
      }
      return;
    }
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (this.pointers.size === 2 && this.pinch) {
      const [a, b] = [...this.pointers.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2 - rect.left, y: (a.y + b.y) / 2 - rect.top };
      const factor = (this.pinch.zoom * (distance / this.pinch.distance)) / this.zoom;
      this.zoomAt(factor, mid.x, mid.y, false);
      if (this.drag) this.drag.moved = true;
      return;
    }

    if (!this.drag) return;
    const dx = event.clientX - this.drag.x;
    const dy = event.clientY - this.drag.y;
    if (!this.drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    this.drag.moved = true;
    this.root.classList.add('is-dragging');
    this.setCamera({ x: this.drag.t.x + dx, y: this.drag.t.y + dy }, this.zoom);
  }

  onPointerUp(event) {
    this.pointers.delete(event.pointerId);
    if (this.pointers.size < 2) this.pinch = null;
    if (this.pointers.size === 0) {
      this.root.classList.remove('is-dragging');
      // Keep `moved` until the click event that follows this pointerup has run.
      setTimeout(() => { this.drag = null; }, 0);
    }
  }

  onWheel(event) {
    if (!(event.ctrlKey || event.metaKey)) {
      this.hint?.classList.add('is-visible');
      clearTimeout(this.hintTimer);
      this.hintTimer = setTimeout(() => this.hint?.classList.remove('is-visible'), 1400);
      return;
    }
    event.preventDefault();
    const rect = this.stage.getBoundingClientRect();
    const factor = Math.exp(-event.deltaY * 0.0022);
    this.zoomAt(factor, event.clientX - rect.left, event.clientY - rect.top, false);
  }

  onKey(event) {
    if (event.target !== this.stage) return;
    const stepPx = 80;
    const moves = { ArrowLeft: [stepPx, 0], ArrowRight: [-stepPx, 0], ArrowUp: [0, stepPx], ArrowDown: [0, -stepPx] };
    if (moves[event.key]) {
      event.preventDefault();
      const [dx, dy] = moves[event.key];
      this.animateTo({ x: this.t.x + dx, y: this.t.y + dy }, this.zoom, 300);
    } else if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      this.zoomIn();
    } else if (event.key === '-' || event.key === '_') {
      event.preventDefault();
      this.zoomOut();
    } else if (event.key === '0') {
      event.preventDefault();
      this.reset();
    }
  }

  /* ----------------------------------------------------------- parallax */

  schedule() {
    if (this.frame || reducedMotion()) return;
    this.frame = requestAnimationFrame(() => this.tick());
  }

  tick() {
    this.frame = null;
    const p = this.parallax;
    p.x += (p.tx - p.x) * 0.12;
    p.y += (p.ty - p.y) * 0.12;
    const amplitude = 14;
    this.layers.forEach(({ el, depth }) => {
      el.setAttribute('transform', `translate(${(-p.x * depth * amplitude).toFixed(2)} ${(-p.y * depth * amplitude).toFixed(2)})`);
    });
    if (Math.abs(p.tx - p.x) > 0.001 || Math.abs(p.ty - p.y) > 0.001) this.schedule();
  }
}
