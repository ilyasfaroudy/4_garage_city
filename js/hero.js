import { SPACES, getType } from './data.js';
import { buildHeroMap } from './city.js';
import { pad, reducedMotion, isDesktopPointer } from './utils.js';

const STRIP_MARK = { available: 'AVAIL', full: 'FULL', locked: 'LOCKED' };

export function initHero(root) {
  buildHeroMap(root.querySelector('[data-hero-map]'), SPACES);

  const layer = root.querySelector('[data-hero-parallax]');
  if (layer && isDesktopPointer() && !reducedMotion()) {
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let frame = null;
    const tick = () => {
      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;
      layer.style.transform = `translate3d(${(current.x * -18).toFixed(2)}px, ${(current.y * -12).toFixed(2)}px, 0)`;
      frame = Math.abs(target.x - current.x) > 0.001 || Math.abs(target.y - current.y) > 0.001 ? requestAnimationFrame(tick) : null;
    };
    root.addEventListener('pointermove', (event) => {
      const rect = root.getBoundingClientRect();
      target.x = (event.clientX - rect.left) / rect.width - 0.5;
      target.y = (event.clientY - rect.top) / rect.height - 0.5;
      if (!frame) frame = requestAnimationFrame(tick);
    });
  }
}

export function renderIndexStrip(root, availability, selectedId) {
  root.innerHTML = SPACES.map((space) => {
    const av = availability.get(space.id);
    return `
      <li>
        <button type="button" class="strip__cell${space.id === selectedId ? ' is-active' : ''}" data-select-space="${space.id}" data-state="${av.state}" data-cursor="view"
          aria-label="${space.code} ${space.name}, ${space.district}: ${av.label}">
          <span class="strip__code">${space.code}</span>
          <span class="strip__type">${getType(space.type)?.label}</span>
          <span class="strip__mark"><i aria-hidden="true"></i>${STRIP_MARK[av.state]}</span>
        </button>
      </li>`;
  }).join('');
}

export function startClock() {
  const targets = document.querySelectorAll('[data-clock]');
  const update = () => {
    const now = new Date();
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    targets.forEach((el) => { el.textContent = time; });
  };
  update();
  setInterval(update, 1000);
}
