import { SPACES, EXTRAS, SLOT_TIMES, getSpace, getService, getExtra } from './data.js';
import { state, setState } from './state.js';
import { DAY_LABELS, DAY_OFFSETS, daySlots, findConflict, slotStatus, spaceAvailability } from './availability.js';
import { saveBookings } from './storage.js';
import { rollNumber, toast } from './ui.js';
import { $, dayDate, escapeHtml, formatNumber, formatPrice, fromMinutes, isoDate, pad, shortDate, toMinutes, WEEKDAYS } from './utils.js';

export const MIN_DURATION = 1;
export const MAX_DURATION = 6;
const PROCESSING_MS = 650;

const SLOT_TEXT = { free: 'FREE', booked: 'BOOKED', yours: 'YOURS', past: 'PAST', locked: 'LOCKED' };

const ui = {
  root: null,
  showErrors: false,
  pickerOpen: false,
  submitting: false,
  notes: {},
  onConfirmed: null,
};

/* ------------------------------------------------------------ pure logic */

export function computePrice(s = state) {
  const space = getSpace(s.selectedSpaceId);
  const service = space ? getService(s.selectedService) : null;
  const durationOk = Number.isInteger(s.duration) && s.duration >= MIN_DURATION && s.duration <= MAX_DURATION;
  const spacePart = space && durationOk ? space.pricePerHour * s.duration : 0;
  const servicePart = service && space.services.includes(service.id) ? service.priceModifier : 0;
  const extrasPart = space
    ? s.selectedExtras.filter((id) => space.extras.includes(id)).reduce((sum, id) => sum + (getExtra(id)?.price ?? 0), 0)
    : 0;
  return { spacePart, servicePart, extrasPart, total: spacePart + servicePart + extrasPart };
}

export function validate(s = state, now = new Date()) {
  const errors = {};
  const space = getSpace(s.selectedSpaceId);
  const service = getService(s.selectedService);

  if (!space) errors.space = 'Выберите пространство — на карте, в списке или ниже.';
  else if (space.status === 'locked') errors.space = 'Это пространство сейчас недоступно для бронирования.';

  if (!service) errors.service = 'Выберите услугу.';
  else if (space && !space.services.includes(service.id)) errors.service = 'Эта услуга недоступна в выбранном пространстве.';

  if (!Number.isInteger(s.duration) || s.duration < MIN_DURATION || s.duration > MAX_DURATION) {
    errors.duration = `Длительность должна быть от ${MIN_DURATION} до ${MAX_DURATION} часов.`;
  } else if (service && s.duration < service.minDuration) {
    errors.duration = `Минимальная длительность для ${service.name} — ${service.minDuration} ч.`;
  }

  if (!DAY_OFFSETS.includes(s.selectedDate)) {
    errors.time = 'Выберите дату.';
  } else if (!s.selectedTime || !SLOT_TIMES.includes(s.selectedTime)) {
    errors.time = 'Выберите свободный слот.';
  } else if (space && space.status !== 'locked') {
    const status = slotStatus(space, s.selectedDate, s.selectedTime, s.bookings, now);
    if (status === 'past') errors.time = `Слот ${s.selectedTime} уже прошёл. Выберите другое время.`;
    else if (status !== 'free') errors.time = `Слот ${s.selectedTime} уже занят. Выберите другое время.`;
    else if (!errors.duration) {
      const conflict = findConflict(space, s.selectedDate, s.selectedTime, s.duration, s.bookings, now);
      if (conflict) errors.duration = `Бронь пересекается с занятым слотом ${conflict}. Уменьшите длительность или выберите другое время.`;
    }
  }
  return errors;
}

function makeBookingId(bookings, now) {
  const prefix = `GC-${String(now.getFullYear()).slice(2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const used = bookings.filter((b) => b.id.startsWith(prefix)).map((b) => Number(b.id.slice(-3)));
  const next = (used.length ? Math.max(...used) : 40) + 1;
  return `${prefix}-${pad(next % 1000, 3)}`;
}

/** Keeps dependent selections consistent after the space changes. */
export function selectionForSpace(spaceId, s = state, now = new Date()) {
  const space = getSpace(spaceId);
  if (!space) return { selectedSpaceId: null, selectedService: null, selectedTime: null, selectedExtras: [] };
  const selectedService = space.services.includes(s.selectedService) ? s.selectedService : null;
  const selectedExtras = s.selectedExtras.filter((id) => space.extras.includes(id));
  let selectedDate = s.selectedDate;
  let selectedTime = s.selectedTime;
  if (selectedTime && slotStatus(space, selectedDate, selectedTime, s.bookings, now) !== 'free') selectedTime = null;
  if (!selectedTime && space.status !== 'locked') {
    const hasFree = (offset) => daySlots(space, offset, s.bookings, now).some((slot) => slot.status === 'free');
    if (!hasFree(selectedDate)) selectedDate = DAY_OFFSETS.find(hasFree) ?? selectedDate;
  }
  return { selectedSpaceId: space.id, selectedService, selectedExtras, selectedDate, selectedTime };
}

/* ---------------------------------------------------------------- render */

const focusKey = (key) => `data-focus-key="${key}"`;

function stepShell(index, id, title, body, error, aside = '') {
  return `
    <li class="step${error ? ' has-error' : ''}" id="step-${id}" data-step="${id}">
      <div class="step__num" aria-hidden="true">${pad(index)}</div>
      <div class="step__main">
        <div class="step__titlebar"><h3 class="step__title">${title}</h3>${aside}</div>
        ${body}
        <p class="field-error" id="err-${id}" role="alert">${error ? escapeHtml(error) : ''}</p>
      </div>
    </li>`;
}

function renderSpaceStep(space, error, now) {
  const picked = space ? `
    <div class="picked">
      <span class="picked__code">${space.code}</span>
      <span class="picked__name">${escapeHtml(space.name)}<small>${space.district} · ${escapeHtml(space.address)}</small></span>
      <span class="picked__rate">${formatPrice(space.pricePerHour)} / H</span>
      <button type="button" class="link" data-action="toggle-picker" aria-expanded="${ui.pickerOpen}" aria-controls="spacePicker" ${focusKey('toggle-picker')}>
        ${ui.pickerOpen ? 'CLOSE LIST' : 'CHANGE'}
      </button>
    </div>` : `
    <p class="step__hint">Пространство не выбрано. Выберите его на карте, в списке или прямо здесь.</p>`;

  const showPicker = !space || ui.pickerOpen;
  const picker = `
    <div class="space-picker" id="spacePicker" ${showPicker ? '' : 'hidden'}>
      ${SPACES.map((s) => {
        const av = spaceAvailability(s, state.bookings, now);
        const locked = av.state === 'locked';
        return `
          <button type="button" class="pick" data-pick-space="${s.id}" aria-pressed="${s.id === space?.id}"
            ${locked ? 'aria-disabled="true"' : ''} data-state="${av.state}" ${focusKey(`space-${s.id}`)} data-cursor="select">
            <span class="pick__code">${s.code}</span>
            <span class="pick__name">${escapeHtml(s.name)}<small>${s.district}</small></span>
            <span class="pick__meta">${locked ? 'LOCKED' : formatNumber(s.pricePerHour) + ' ₽'}</span>
          </button>`;
      }).join('')}
    </div>`;
  return stepShell(1, 'space', 'SPACE', picked + picker, error);
}

function renderServiceStep(space, error) {
  if (!space) return stepShell(2, 'service', 'SERVICE', '<p class="step__placeholder">Доступно после выбора пространства.</p>', error);
  const body = `
    <div class="services" role="group" aria-label="Услуги">
      ${space.services.map((id, i) => {
        const service = getService(id);
        return `
          <button type="button" class="svc" data-pick-service="${id}" aria-pressed="${state.selectedService === id}" ${focusKey(`service-${id}`)} data-cursor="select">
            <span class="svc__idx">${pad(i + 1)}</span>
            <span class="svc__name">${service.name}</span>
            <span class="svc__desc">${escapeHtml(service.description)}</span>
            <span class="svc__price">+${formatPrice(service.priceModifier)}</span>
            <span class="svc__min">MIN ${service.minDuration} H</span>
          </button>`;
      }).join('')}
    </div>`;
  return stepShell(2, 'service', 'SERVICE', body, error);
}

function renderDateStep(space, now) {
  const body = `
    <div class="dates" role="group" aria-label="Дата">
      ${DAY_OFFSETS.map((offset) => {
        const date = dayDate(offset, now);
        const free = space ? daySlots(space, offset, state.bookings, now).filter((s) => s.status === 'free').length : null;
        return `
          <button type="button" class="date" data-pick-date="${offset}" aria-pressed="${state.selectedDate === offset}" ${focusKey(`date-${offset}`)}>
            <span class="date__label">${DAY_LABELS[offset]}</span>
            <span class="date__day">${shortDate(date)} <small>${WEEKDAYS[date.getDay()]}</small></span>
            <span class="date__free">${free === null ? '— FREE' : `${pad(free)} FREE`}</span>
          </button>`;
      }).join('')}
    </div>`;
  return stepShell(3, 'date', 'DATE', body, null);
}

function renderTimeStep(space, error, now) {
  if (!space) return stepShell(4, 'time', 'TIME', '<p class="step__placeholder">Слоты появятся после выбора пространства.</p>', error);
  const slots = daySlots(space, state.selectedDate, state.bookings, now);
  const body = `
    <div class="slots" role="group" aria-label="Время начала">
      ${slots.map(({ time, status }) => {
        const unavailable = status !== 'free';
        return `
          <button type="button" class="slot" data-pick-time="${time}" data-status="${status}"
            aria-pressed="${state.selectedTime === time}" ${unavailable ? 'aria-disabled="true"' : ''}
            aria-label="${time} — ${SLOT_TEXT[status]}" ${focusKey(`time-${time}`)} data-cursor="select">
            <span class="slot__time">${time}</span>
            <span class="slot__state">${SLOT_TEXT[status]}</span>
          </button>`;
      }).join('')}
    </div>
    <p class="slots__legend" aria-hidden="true"><span><i class="lg lg--free"></i>FREE</span><span><i class="lg lg--booked"></i>BOOKED</span><span><i class="lg lg--yours"></i>YOURS</span><span><i class="lg lg--past"></i>PAST</span></p>`;
  return stepShell(4, 'time', 'TIME', body, error);
}

function renderDurationStep(space, error) {
  const service = getService(state.selectedService);
  const min = Math.max(MIN_DURATION, service?.minDuration ?? MIN_DURATION);
  const start = state.selectedTime ? toMinutes(state.selectedTime) : null;
  const range = start === null ? 'START — END' : `${state.selectedTime} — ${fromMinutes(start + state.duration * 60)}`;
  const body = `
    <div class="duration">
      <div class="stepper" role="group" aria-label="Длительность">
        <button type="button" class="stepper__btn" data-duration="-1" aria-label="Уменьшить длительность" ${state.duration <= min ? 'aria-disabled="true"' : ''} ${focusKey('dur-minus')}>−</button>
        <output class="stepper__val" aria-live="polite"><span>${state.duration}</span> H</output>
        <button type="button" class="stepper__btn" data-duration="1" aria-label="Увеличить длительность" ${state.duration >= MAX_DURATION ? 'aria-disabled="true"' : ''} ${focusKey('dur-plus')}>+</button>
      </div>
      <div class="duration__meta">
        <span class="duration__range">${range}</span>
        <span class="duration__scale" aria-hidden="true">${Array.from({ length: MAX_DURATION }, (_, i) => `<i class="${i < state.duration ? 'on' : ''}${i < min - 1 ? ' min' : ''}"></i>`).join('')}</span>
        <span class="duration__note">${ui.notes.duration ? escapeHtml(ui.notes.duration) : `${MIN_DURATION}–${MAX_DURATION} H · MIN ${min} H${service ? ' FOR ' + service.name : ''}`}</span>
      </div>
    </div>`;
  return stepShell(5, 'duration', 'DURATION', body, error);
}

function renderExtrasStep(space) {
  if (!space) return stepShell(6, 'extras', 'EXTRAS', '<p class="step__placeholder">Опции зависят от пространства.</p>', null, '<span class="step__opt">OPTIONAL</span>');
  const body = `
    <div class="extras" role="group" aria-label="Дополнительные опции">
      ${EXTRAS.filter((extra) => space.extras.includes(extra.id)).map((extra) => `
        <button type="button" class="extra" data-toggle-extra="${extra.id}" aria-pressed="${state.selectedExtras.includes(extra.id)}" ${focusKey(`extra-${extra.id}`)} data-cursor="select">
          <span class="extra__box" aria-hidden="true"></span>
          <span class="extra__name">${extra.name}<small>${escapeHtml(extra.description)}</small></span>
          <span class="extra__price">+${formatPrice(extra.price)}</span>
        </button>`).join('')}
    </div>`;
  return stepShell(6, 'extras', 'EXTRAS', body, null, '<span class="step__opt">OPTIONAL</span>');
}

function renderSummary(space, errors) {
  const root = ui.root;
  const service = getService(state.selectedService);
  const price = computePrice();
  const date = dayDate(state.selectedDate);
  const start = state.selectedTime ? toMinutes(state.selectedTime) : null;
  const extras = space ? state.selectedExtras.filter((id) => space.extras.includes(id)).map((id) => getExtra(id).name) : [];

  $('[data-sum-code]', root).textContent = space ? space.code : '—';
  $('[data-sum-space]', root).textContent = space ? `${space.name} / ${space.district}` : 'NO SPACE SELECTED';
  $('[data-sum-service]', root).textContent = service?.name ?? '—';
  $('[data-sum-date]', root).textContent = `${DAY_LABELS[state.selectedDate]} · ${shortDate(date)}`;
  $('[data-sum-time]', root).textContent = start === null ? '—' : `${state.selectedTime}—${fromMinutes(start + state.duration * 60)}`;
  $('[data-sum-duration]', root).textContent = `${state.duration} H`;
  $('[data-sum-extras]', root).textContent = extras.length ? extras.join(', ') : 'NONE';
  $('[data-sum-formula]', root).textContent = space
    ? `${formatNumber(space.pricePerHour)} × ${state.duration} H + ${formatNumber(price.servicePart)} + ${formatNumber(price.extrasPart)}`
    : 'RATE × DURATION + SERVICE + EXTRAS';

  rollNumber($('[data-roll="space"]', root), formatNumber(price.spacePart));
  rollNumber($('[data-roll="service"]', root), formatNumber(price.servicePart));
  rollNumber($('[data-roll="extras"]', root), formatNumber(price.extrasPart));
  rollNumber($('[data-roll="total"]', root), formatNumber(price.total));
  rollNumber($('[data-roll="dock"]', root), formatNumber(price.total));

  const ready = Object.keys(errors).length === 0;
  root.querySelectorAll('[data-action="submit-booking"]').forEach((button) => {
    button.classList.toggle('is-ready', ready);
  });
  const progress = ['space', 'service', 'time', 'duration'].filter((key) => !errors[key]).length;
  $('[data-sum-progress]', root).textContent = `${progress}/4 REQUIRED`;
  $('[data-sum-progress-bar]', root).style.setProperty('--p', progress / 4);
}

export function renderBooking(now = new Date()) {
  const root = ui.root;
  if (!root) return;
  const space = getSpace(state.selectedSpaceId);
  const errors = validate(state, now);
  const shown = ui.showErrors ? errors : {};
  const active = document.activeElement?.dataset?.focusKey;

  $('[data-steps]', root).innerHTML = [
    renderSpaceStep(space, shown.space, now),
    renderServiceStep(space, shown.service),
    renderDateStep(space, now),
    renderTimeStep(space, shown.time, now),
    renderDurationStep(space, shown.duration),
    renderExtrasStep(space),
  ].join('');

  $('[data-booking-code]', root).textContent = space ? space.code : '00';
  renderSummary(space, errors);

  if (active) root.querySelector(`[data-focus-key="${active}"]`)?.focus({ preventScroll: true });
}

/* ---------------------------------------------------------------- events */

function showError(step, message) {
  const holder = ui.root.querySelector(`#err-${step}`);
  if (!holder) return;
  holder.textContent = message;
  holder.closest('.step')?.classList.add('has-error');
}

function onClick(event) {
  const target = event.target.closest('button');
  if (!target || !ui.root.contains(target)) return;
  const now = new Date();
  ui.notes = {};

  if (target.dataset.pickSpace) {
    const space = getSpace(target.dataset.pickSpace);
    if (space.status === 'locked') {
      toast('SPACE UNAVAILABLE', space.statusNote || 'Пространство закрыто для бронирования', 'alert');
      showError('space', 'Это пространство сейчас недоступно для бронирования.');
      return;
    }
    ui.pickerOpen = false;
    setState(selectionForSpace(space.id, state, now));
    return;
  }

  if (target.dataset.action === 'toggle-picker') {
    ui.pickerOpen = !ui.pickerOpen;
    renderBooking(now);
    return;
  }

  if (target.dataset.pickService) {
    const service = getService(target.dataset.pickService);
    const patch = { selectedService: service.id };
    if (state.duration < service.minDuration) {
      patch.duration = service.minDuration;
      ui.notes.duration = `Длительность увеличена до ${service.minDuration} ч — минимум для ${service.name}.`;
    }
    setState(patch);
    return;
  }

  if (target.dataset.pickDate !== undefined) {
    const offset = Number(target.dataset.pickDate);
    const space = getSpace(state.selectedSpaceId);
    const keep = space && state.selectedTime && slotStatus(space, offset, state.selectedTime, state.bookings, now) === 'free';
    setState({ selectedDate: offset, selectedTime: keep ? state.selectedTime : null });
    return;
  }

  if (target.dataset.pickTime) {
    const space = getSpace(state.selectedSpaceId);
    const time = target.dataset.pickTime;
    const status = space ? slotStatus(space, state.selectedDate, time, state.bookings, now) : 'locked';
    if (status !== 'free') {
      const reason = { booked: 'уже занят', yours: 'занят вашей бронью', past: 'уже прошёл', locked: 'недоступен' }[status];
      showError('time', `Слот ${time} ${reason}. Выберите свободное время.`);
      toast('SLOT UNAVAILABLE', `${time} — ${SLOT_TEXT[status]}`, 'alert');
      return;
    }
    setState({ selectedTime: state.selectedTime === time ? null : time });
    return;
  }

  if (target.dataset.duration) {
    const service = getService(state.selectedService);
    const min = Math.max(MIN_DURATION, service?.minDuration ?? MIN_DURATION);
    const next = state.duration + Number(target.dataset.duration);
    if (next < min || next > MAX_DURATION) {
      showError('duration', next > MAX_DURATION
        ? `Максимальная длительность — ${MAX_DURATION} часов.`
        : `Минимальная длительность${service ? ' для ' + service.name : ''} — ${min} ч.`);
      return;
    }
    setState({ duration: next });
    return;
  }

  if (target.dataset.toggleExtra) {
    const id = target.dataset.toggleExtra;
    const selectedExtras = state.selectedExtras.includes(id)
      ? state.selectedExtras.filter((extra) => extra !== id)
      : [...state.selectedExtras, id];
    setState({ selectedExtras });
    return;
  }

  if (target.dataset.action === 'submit-booking') submit();
}

function setSubmitting(flag) {
  ui.submitting = flag;
  ui.root.classList.toggle('is-submitting', flag);
  ui.root.querySelectorAll('[data-action="submit-booking"]').forEach((button) => {
    button.disabled = flag;
    button.setAttribute('aria-busy', String(flag));
    const label = button.querySelector('[data-submit-label]');
    if (label) label.textContent = flag ? 'PROCESSING…' : label.dataset.default;
  });
}

function focusFirstError(errors) {
  const order = ['space', 'service', 'time', 'duration'];
  const first = order.find((key) => errors[key]);
  if (!first) return;
  const step = ui.root.querySelector(`#step-${first}`);
  step?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const control = step?.querySelector('button:not([aria-disabled="true"])');
  control?.focus({ preventScroll: true });
}

async function submit() {
  if (ui.submitting) return;
  const errors = validate();
  if (Object.keys(errors).length) {
    ui.showErrors = true;
    renderBooking();
    focusFirstError(errors);
    toast('CHECK CONFIGURATION', 'Заполните отмеченные шаги', 'alert');
    return;
  }

  setSubmitting(true);
  await new Promise((resolve) => setTimeout(resolve, PROCESSING_MS));

  // Re-check right before writing: time may have passed while processing.
  const now = new Date();
  const finalErrors = validate(state, now);
  if (Object.keys(finalErrors).length) {
    setSubmitting(false);
    ui.showErrors = true;
    renderBooking(now);
    focusFirstError(finalErrors);
    return;
  }

  const price = computePrice();
  const space = getSpace(state.selectedSpaceId);
  const booking = {
    id: makeBookingId(state.bookings, now),
    spaceId: space.id,
    serviceId: state.selectedService,
    date: isoDate(dayDate(state.selectedDate, now)),
    time: state.selectedTime,
    duration: state.duration,
    extras: state.selectedExtras.filter((id) => space.extras.includes(id)),
    total: price.total,
    breakdown: { space: price.spacePart, service: price.servicePart, extras: price.extrasPart },
    createdAt: now.toISOString(),
  };
  const bookings = [...state.bookings, booking];
  const saved = saveBookings(bookings);

  ui.showErrors = false;
  setState({ bookings, selectedTime: null, selectedExtras: [], selectedService: null });
  setSubmitting(false);
  ui.onConfirmed?.(booking);
  toast('BOOKING CREATED', booking.id);
  if (!saved) toast('STORAGE ERROR', 'Бронь действует до перезагрузки страницы', 'alert');
}

export function resetBookingUi() {
  ui.showErrors = false;
  ui.pickerOpen = false;
  ui.notes = {};
}

export function initBooking(root, { onConfirmed }) {
  ui.root = root;
  ui.onConfirmed = onConfirmed;
  root.querySelectorAll('[data-submit-label]').forEach((label) => { label.dataset.default = label.textContent; });
  root.addEventListener('click', onClick);
}

