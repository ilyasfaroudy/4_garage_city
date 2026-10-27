import { getExtra, getService, getSpace, getType } from './data.js';
import { state, setState } from './state.js';
import { saveBookings } from './storage.js';
import { toast } from './ui.js';
import { escapeHtml, formatNumber, formatPrice, fromMinutes, isoDate, nowMinutes, pad, parseIso, reducedMotion, shortDate, toMinutes, WEEKDAYS } from './utils.js';

const ARM_TIMEOUT = 4000;
const LEAVE_MS = 520;

function passStatus(booking, now) {
  const today = isoDate(now);
  if (booking.date > today) return { id: 'upcoming', label: 'CONFIRMED' };
  if (booking.date < today) return { id: 'past', label: 'COMPLETED' };
  const end = toMinutes(booking.time) + booking.duration * 60;
  if (end <= nowMinutes(now)) return { id: 'past', label: 'COMPLETED' };
  if (toMinutes(booking.time) <= nowMinutes(now)) return { id: 'live', label: 'IN PROGRESS' };
  return { id: 'today', label: 'TODAY' };
}

/** Deterministic vertical barcode derived from the booking id. */
function barcode(id) {
  let y = 0;
  const bars = [];
  [...id].forEach((ch, i) => {
    const code = ch.charCodeAt(0) + i * 7;
    for (let k = 0; k < 3; k += 1) {
      const h = 1 + ((code >> k) % 3);
      if ((code + k) % 2 === 0) bars.push(`<rect x="0" y="${y}" width="44" height="${h}"/>`);
      y += h + 1;
    }
  });
  return `<svg class="ticket__barcode" viewBox="0 0 44 ${y}" preserveAspectRatio="none" aria-hidden="true">${bars.join('')}</svg>`;
}

export function renderPasses(root, now = new Date()) {
  const list = root.querySelector('[data-passes]');
  const bookings = [...state.bookings].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  const active = bookings.filter((b) => passStatus(b, now).id !== 'past');
  const sum = bookings.reduce((total, b) => total + b.total, 0);

  root.querySelector('[data-passes-count]').textContent = pad(active.length);
  root.querySelector('[data-passes-total]').textContent = formatPrice(sum);
  root.querySelector('[data-passes-all]').textContent = pad(bookings.length);

  if (!bookings.length) {
    list.innerHTML = `
      <li class="passes-empty">
        <span class="passes-empty__frame" aria-hidden="true"><span>NO</span><span>PASS</span></span>
        <div>
          <p class="passes-empty__title">NO ACTIVE PASSES</p>
          <p class="passes-empty__text">Здесь появятся ваши цифровые пропуска. Выберите пространство на карте сети и соберите бронь — она сохранится в этом браузере.</p>
          <a class="btn btn--light" href="#explore" data-action="explore-network" data-cursor="view">EXPLORE NETWORK <span aria-hidden="true">↘</span></a>
        </div>
      </li>`;
    return;
  }

  list.innerHTML = bookings.map((booking) => {
    const space = getSpace(booking.spaceId);
    const service = getService(booking.serviceId);
    const status = passStatus(booking, now);
    const date = parseIso(booking.date);
    const end = fromMinutes(toMinutes(booking.time) + booking.duration * 60);
    const extras = booking.extras.map((id) => getExtra(id)?.name).filter(Boolean);
    return `
      <li class="ticket" data-booking="${booking.id}" data-status="${status.id}">
        <div class="ticket__stub">
          <span class="ticket__code">${space.code}</span>
          <span class="ticket__type">${getType(space.type)?.label ?? ''}</span>
          <span class="ticket__gate">GATE ${space.code}-A</span>
        </div>
        <div class="ticket__main">
          <div class="ticket__top">
            <span class="label">ACCESS PASS / GARAGE//CITY</span>
            <span class="ticket__status"><i aria-hidden="true"></i>${status.label}</span>
          </div>
          <p class="ticket__id">${booking.id}</p>
          <p class="ticket__space">${space.code} / ${escapeHtml(space.name)} — ${space.district}</p>
          <dl class="ticket__grid">
            <div><dt>SERVICE</dt><dd>${service.name}</dd></div>
            <div><dt>DATE</dt><dd>${shortDate(date)} ${WEEKDAYS[date.getDay()]}</dd></div>
            <div><dt>TIME</dt><dd>${booking.time}—${end}</dd></div>
            <div><dt>DURATION</dt><dd>${booking.duration} H</dd></div>
            <div class="ticket__wide"><dt>EXTRAS</dt><dd>${extras.length ? extras.join(', ') : 'NONE'}</dd></div>
            <div class="ticket__total"><dt>TOTAL</dt><dd>${formatNumber(booking.total)} ₽</dd></div>
          </dl>
          <p class="ticket__address">${escapeHtml(space.address)}</p>
        </div>
        <div class="ticket__side">
          ${barcode(booking.id)}
          <button type="button" class="ticket__cancel" data-cancel="${booking.id}" data-cursor="close"
            aria-label="Отменить бронь ${booking.id}">CANCEL RESERVATION</button>
        </div>
      </li>`;
  }).join('');
}

function cancelBooking(id) {
  const bookings = state.bookings.filter((b) => b.id !== id);
  const saved = saveBookings(bookings);
  setState({ bookings });
  toast('BOOKING CANCELLED', `${id} — слот снова доступен`);
  if (!saved) toast('STORAGE ERROR', 'Изменение не сохранится после перезагрузки', 'alert');
}

export function initPasses(root) {
  const timers = new Map();
  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-cancel]');
    if (!button) return;
    const id = button.dataset.cancel;

    // Two-step cancel: the first press arms the button, the second confirms.
    if (!button.classList.contains('is-armed')) {
      button.classList.add('is-armed');
      button.textContent = 'CONFIRM CANCEL ×';
      button.setAttribute('aria-label', `Подтвердите отмену брони ${id}`);
      timers.set(id, setTimeout(() => {
        button.classList.remove('is-armed');
        button.textContent = 'CANCEL RESERVATION';
        button.setAttribute('aria-label', `Отменить бронь ${id}`);
      }, ARM_TIMEOUT));
      return;
    }
    clearTimeout(timers.get(id));
    button.disabled = true;
    const ticket = button.closest('.ticket');
    ticket.classList.add('is-leaving');
    setTimeout(() => cancelBooking(id), reducedMotion() ? 0 : LEAVE_MS);
  });
}
