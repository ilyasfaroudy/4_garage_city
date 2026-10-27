import { getService } from './data.js';
import { escapeHtml, formatNumber, isDesktopPointer, reducedMotion } from './utils.js';
import { spaceImage } from './ui.js';

export const SORTS = [
  { id: 'code', label: 'NO' },
  { id: 'price', label: 'RATE' },
  { id: 'rating', label: 'RATING' },
];

function sortSpaces(spaces, sort) {
  const list = [...spaces];
  if (sort === 'price') list.sort((a, b) => a.pricePerHour - b.pricePerHour);
  else if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
  else list.sort((a, b) => a.code.localeCompare(b.code));
  return list;
}

export function renderList(root, { spaces, availability, selectedId, sort }) {
  const body = root.querySelector('[data-list-body]');
  root.querySelectorAll('[data-sort]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.sort === sort));
  });

  if (!spaces.length) {
    body.innerHTML = `
      <li class="list-empty">
        <span class="list-empty__num">00</span>
        <div>
          <p class="list-empty__title">NO SPACES MATCH</p>
          <p class="list-empty__text">По выбранным параметрам пространств нет. Ослабьте фильтр цены или доступности.</p>
          <button type="button" class="btn btn--light" data-action="reset-filters">RESET FILTERS</button>
        </div>
      </li>`;
    return;
  }

  body.innerHTML = sortSpaces(spaces, sort).map((space) => {
    const av = availability.get(space.id);
    const services = space.services.slice(0, 2).map((id) => getService(id)?.name.split(' ')[0]).join(' / ');
    return `
      <li class="row" data-id="${space.id}" data-state="${av.state}">
        <button type="button" class="row__btn${space.id === selectedId ? ' is-active' : ''}" data-select-space="${space.id}" data-cursor="view"
          aria-label="${space.code} ${escapeHtml(space.name)}, ${space.district}. От ${formatNumber(space.pricePerHour)} рублей в час. ${av.label}">
          <span class="row__no">${space.code}</span>
          <span class="row__name">${escapeHtml(space.name)}<small>${space.district}</small></span>
          <span class="row__type">${services}</span>
          <span class="row__rate">FROM ${formatNumber(space.pricePerHour)} ₽<small>/ HOUR</small></span>
          <span class="row__avail"><i aria-hidden="true"></i>${av.label}</span>
          <span class="row__rating">${space.rating.toFixed(1)}</span>
          <span class="row__arrow" aria-hidden="true">→</span>
        </button>
      </li>`;
  }).join('');
}

/** Floating image preview that follows the pointer over list rows (desktop only). */
export function initListPreview(root, getSpace) {
  const preview = root.querySelector('[data-list-preview]');
  if (!preview || !isDesktopPointer()) return;
  let currentId = null;
  let target = { x: 0, y: 0 };
  let pos = { x: 0, y: 0 };
  let frame = null;

  const loop = () => {
    const ease = reducedMotion() ? 1 : 0.18;
    pos.x += (target.x - pos.x) * ease;
    pos.y += (target.y - pos.y) * ease;
    preview.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0)`;
    frame = Math.abs(target.y - pos.y) > 0.2 || Math.abs(target.x - pos.x) > 0.2 ? requestAnimationFrame(loop) : null;
  };

  root.addEventListener('pointermove', (event) => {
    const row = event.target.closest('.row');
    const rect = root.getBoundingClientRect();
    if (!row) {
      preview.classList.remove('is-visible');
      currentId = null;
      return;
    }
    target = { x: event.clientX - rect.left + 28, y: event.clientY - rect.top - 90 };
    if (currentId !== row.dataset.id) {
      currentId = row.dataset.id;
      const space = getSpace(currentId);
      preview.innerHTML = `${spaceImage(space)}<span class="list-preview__cap">FIG. ${space.code} / ${escapeHtml(space.name)}</span>`;
      if (!preview.classList.contains('is-visible')) pos = { ...target };
      preview.classList.remove('is-visible');
      requestAnimationFrame(() => preview.classList.add('is-visible'));
    }
    if (!frame) frame = requestAnimationFrame(loop);
  });
  root.addEventListener('pointerleave', () => {
    preview.classList.remove('is-visible');
    currentId = null;
  });
}
