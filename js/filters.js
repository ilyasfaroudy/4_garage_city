import { NEEDS, SPACE_TYPES, DISTRICTS } from './data.js';
import { DEFAULT_FILTERS } from './state.js';
import { daySlots } from './availability.js';
import { $$, nowMinutes, pad, toMinutes } from './utils.js';

export const PRICE_OPTIONS = [
  { id: 'all', label: 'ALL' },
  { id: '1500', label: '≤ 1500' },
  { id: '3000', label: '≤ 3000' },
  { id: '5000', label: '≤ 5000' },
];

export const AVAILABILITY_OPTIONS = [
  { id: 'all', label: 'ALL' },
  { id: 'now', label: 'NOW', hint: 'Свободно в ближайшие 2 часа' },
  { id: 'today', label: 'TODAY' },
  { id: 'evening', label: 'EVENING', hint: 'Сегодня после 18:00' },
];

const EVENING_FROM = 18 * 60;
const NOW_WINDOW = 120;

export function typesFor(filters) {
  if (filters.need) return NEEDS.find((need) => need.id === filters.need)?.types ?? null;
  return filters.type === 'all' ? null : [filters.type];
}

function matchesAvailability(space, mode, bookings, now) {
  if (mode === 'all') return true;
  if (space.status === 'locked') return false;
  const free = daySlots(space, 0, bookings, now)
    .filter((slot) => slot.status === 'free')
    .map((slot) => toMinutes(slot.time));
  if (mode === 'today') return free.length > 0;
  if (mode === 'evening') return free.some((minutes) => minutes >= EVENING_FROM);
  if (mode === 'now') return free.some((minutes) => minutes - nowMinutes(now) <= NOW_WINDOW);
  return true;
}

export function filterSpaces(spaces, filters, bookings, now = new Date()) {
  const types = typesFor(filters);
  return spaces.filter((space) =>
    (!types || types.includes(space.type)) &&
    (filters.price === 'all' || space.pricePerHour <= Number(filters.price)) &&
    (filters.district === 'all' || space.district === filters.district) &&
    matchesAvailability(space, filters.availability, bookings, now));
}

export function activeFilterCount(filters) {
  return Object.keys(DEFAULT_FILTERS).filter((key) => filters[key] !== DEFAULT_FILTERS[key]).length;
}

const option = (group, item) => `
  <button type="button" class="opt" data-filter="${group}" data-value="${item.id}" aria-pressed="false"${item.hint ? ` title="${item.hint}"` : ''}>
    <span class="opt__box" aria-hidden="true"></span>${item.label}
  </button>`;

export function renderFilters(root) {
  root.innerHTML = `
    <div class="filters__head">
      <span class="label">FILTERS / <span data-filter-count>00</span> ACTIVE</span>
      <button type="button" class="filters__close" data-action="close-filters" data-cursor="close" aria-label="Закрыть фильтры">CLOSE ×</button>
    </div>

    <section class="fgroup fgroup--need" aria-labelledby="fNeed">
      <h3 class="fgroup__title" id="fNeed"><span>A</span>WHAT DO YOU NEED?</h3>
      <div class="need-grid">
        ${NEEDS.map((need, i) => `
          <button type="button" class="need" data-filter="need" data-value="${need.id}" aria-pressed="false" data-cursor="select">
            <span class="need__idx">${pad(i + 1)}</span>
            <span class="need__label">${need.label}</span>
            <span class="need__hint">${need.hint}</span>
          </button>`).join('')}
      </div>
      <p class="fgroup__note" data-need-note aria-live="polite"></p>
    </section>

    <section class="fgroup" aria-labelledby="fType">
      <h3 class="fgroup__title" id="fType"><span>B</span>TYPE</h3>
      <div class="opts">${option('type', { id: 'all', label: 'ALL' })}${SPACE_TYPES.map((t) => option('type', t)).join('')}</div>
    </section>

    <section class="fgroup" aria-labelledby="fPrice">
      <h3 class="fgroup__title" id="fPrice"><span>C</span>PRICE / HOUR, ₽</h3>
      <div class="opts">${PRICE_OPTIONS.map((p) => option('price', p)).join('')}</div>
    </section>

    <section class="fgroup" aria-labelledby="fAvail">
      <h3 class="fgroup__title" id="fAvail"><span>D</span>AVAILABILITY</h3>
      <div class="opts">${AVAILABILITY_OPTIONS.map((a) => option('availability', a)).join('')}</div>
    </section>

    <section class="fgroup" aria-labelledby="fDistrict">
      <h3 class="fgroup__title" id="fDistrict"><label for="districtSelect"><span>E</span>DISTRICT</label></h3>
      <div class="select">
        <select id="districtSelect" data-filter-select="district">
          <option value="all">ALL DISTRICTS</option>
          ${DISTRICTS.map((d) => `<option value="${d}">${d}</option>`).join('')}
        </select>
      </div>
    </section>

    <div class="filters__foot">
      <button type="button" class="link" data-action="reset-filters">RESET FILTERS</button>
      <button type="button" class="btn btn--light filters__apply" data-action="close-filters">SHOW <span data-result-count>12</span></button>
    </div>`;
}

export function syncFilters(root, filters) {
  const matched = typesFor(filters) || [];
  $$('[data-filter]', root).forEach((button) => {
    const group = button.dataset.filter;
    const value = button.dataset.value;
    let pressed;
    if (group === 'need') pressed = filters.need === value;
    else if (group === 'type') pressed = !filters.need && filters.type === value;
    else pressed = filters[group] === value;
    button.setAttribute('aria-pressed', String(pressed));
    if (group === 'type') button.classList.toggle('is-matched', Boolean(filters.need) && matched.includes(value));
  });
  const select = root.querySelector('[data-filter-select="district"]');
  if (select) select.value = filters.district;
  const need = NEEDS.find((n) => n.id === filters.need);
  const note = root.querySelector('[data-need-note]');
  if (note) {
    note.textContent = need
      ? `MATCH → ${need.types.map((t) => t.toUpperCase()).join(' + ')}`
      : 'Выберите задачу — система подберёт тип пространства.';
  }
  const count = root.querySelector('[data-filter-count]');
  if (count) count.textContent = pad(activeFilterCount(filters));
}

/** Translates a click on a filter control into a new filters object. */
export function nextFilters(filters, group, value) {
  if (group === 'need') {
    return { ...filters, need: filters.need === value ? null : value, type: 'all' };
  }
  if (group === 'type') return { ...filters, type: value, need: null };
  return { ...filters, [group]: value };
}
