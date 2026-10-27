import { getService, getType } from './data.js';
import { escapeHtml, formatPrice, pad } from './utils.js';
import { spaceImage } from './ui.js';

const STATUS_TEXT = {
  available: 'AVAILABLE',
  full: 'BOOKED TODAY',
  locked: 'LOCKED',
};

export function renderDetail(drawer, space, av) {
  const content = drawer.querySelector('[data-drawer-content]');
  const foot = drawer.querySelector('[data-drawer-foot]');
  drawer.querySelector('[data-drawer-code]').textContent = space ? space.code : '—';

  if (!space) {
    content.innerHTML = `
      <div class="drawer-empty">
        <p class="drawer-empty__num">—</p>
        <p>Пространство не выбрано. Выберите точку на карте или строку в списке.</p>
      </div>`;
    foot.innerHTML = '';
    return;
  }

  const locked = av.state === 'locked';
  const ratingCells = Array.from({ length: 10 }, (_, i) => `<i class="${i < Math.round(space.rating * 2) ? 'on' : ''}"></i>`).join('');

  content.innerHTML = `
    <figure class="drawer__figure">
      ${spaceImage(space, 'drawer__img')}
      <figcaption><span>FIG. ${space.code}</span><span>${escapeHtml(space.district)}</span></figcaption>
    </figure>

    <header class="drawer__head">
      <p class="drawer__kicker">SPACE ${space.code} / ${getType(space.type)?.label ?? ''}</p>
      <h2 class="drawer__title" id="drawerTitle">${escapeHtml(space.name)}</h2>
      <p class="drawer__lead">${escapeHtml(space.shortDescription)}</p>
    </header>

    ${locked ? `
      <div class="notice notice--locked" role="note">
        <span class="notice__tag">SPACE UNAVAILABLE</span>
        <span>${escapeHtml(space.statusNote || 'Бронирование временно закрыто.')}</span>
      </div>` : ''}

    <dl class="spec">
      <div><dt>SPACE CODE</dt><dd>GC-${space.code}</dd></div>
      <div><dt>NAME</dt><dd>${escapeHtml(space.name)}</dd></div>
      <div><dt>DISTRICT</dt><dd>${escapeHtml(space.district)}</dd></div>
      <div><dt>ADDRESS</dt><dd>${escapeHtml(space.address)}</dd></div>
      <div><dt>STATUS</dt><dd><span class="status status--${av.state}">${STATUS_TEXT[av.state]}</span></dd></div>
      <div><dt>RATE</dt><dd>${formatPrice(space.pricePerHour)} / HOUR</dd></div>
      <div><dt>NEXT AVAILABLE</dt><dd>${locked ? '—' : av.nextLabel}</dd></div>
      <div><dt>CAPACITY</dt><dd>${pad(space.capacity)} ${space.capacity === 1 ? 'CAR' : 'CARS'}</dd></div>
    </dl>

    <section class="drawer__section">
      <h3 class="drawer__h">DESCRIPTION</h3>
      <p class="drawer__text">${escapeHtml(space.fullDescription)}</p>
    </section>

    <section class="drawer__section">
      <h3 class="drawer__h">SERVICES</h3>
      <ol class="drawer__services">
        ${space.services.map((id, i) => {
          const service = getService(id);
          return `<li><span>${pad(i + 1)}</span><span>${service.name}</span><span>+${formatPrice(service.priceModifier)}</span></li>`;
        }).join('')}
      </ol>
    </section>

    <section class="drawer__section">
      <h3 class="drawer__h">EQUIPMENT</h3>
      <ul class="drawer__equipment">
        ${space.equipment.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
    </section>

    <section class="drawer__section drawer__rating">
      <h3 class="drawer__h">RATING</h3>
      <p><strong>${space.rating.toFixed(1)}</strong><span>/ 5.0</span></p>
      <span class="rating-bar" aria-hidden="true">${ratingCells}</span>
    </section>`;

  foot.innerHTML = `
    <div class="drawer__price">
      <span class="label">RATE</span>
      <span class="drawer__price-val">${formatPrice(space.pricePerHour)}<small>/ H</small></span>
    </div>
    <button type="button" class="btn btn--burgundy btn--wide" data-action="start-booking" data-cursor="book"
      ${locked ? 'aria-disabled="true"' : ''}>
      ${locked ? 'SPACE UNAVAILABLE' : 'SELECT SERVICE <span aria-hidden="true">→</span>'}
    </button>`;
  content.scrollTop = 0;
}
