import { SPACES, getSpace } from './data.js';
import { state, setState, subscribe, notify, DEFAULT_FILTERS } from './state.js';
import { loadBookings, clearBookings } from './storage.js';
import { spaceAvailability } from './availability.js';
import { CityMap } from './map.js';
import { renderFilters, syncFilters, filterSpaces, nextFilters, activeFilterCount } from './filters.js';
import { renderList, initListPreview } from './list.js';
import { renderDetail } from './detail.js';
import { initBooking, renderBooking, selectionForSpace, resetBookingUi } from './booking.js';
import { initPasses, renderPasses } from './passes.js';
import { initHero, renderIndexStrip, startClock } from './hero.js';
import { toast, confirmDialog, initCursor, observeReveals, bindImageFallbacks } from './ui.js';
import { $, $$, pad, formatNumber, reducedMotion } from './utils.js';

const VIEWS = ['explore', 'spaces', 'booking', 'bookings', 'about'];
const TICK_MS = 30000;

const el = {
  body: document.body,
  network: $('[data-network]'),
  filters: $('[data-filters]'),
  list: $('[data-list]'),
  drawer: $('[data-drawer]'),
  scrim: $('[data-scrim]'),
  strip: $('[data-index-strip]'),
  booking: $('[data-booking]'),
  passes: $('[data-passes-root]'),
  confirm: $('[data-confirm]'),
  storageNote: $('[data-storage-note]'),
};

let map;
let visibleIds = new Set();
let availability = new Map();
let lastTrigger = null;
let filtersOpen = false;

/* ------------------------------------------------------------ derived data */

function compute(now = new Date()) {
  availability = new Map(SPACES.map((space) => [space.id, spaceAvailability(space, state.bookings, now)]));
  visibleIds = new Set(filterSpaces(SPACES, state.activeFilters, state.bookings, now).map((space) => space.id));
}

/* ---------------------------------------------------------------- render */

function renderNetwork() {
  const visible = SPACES.filter((space) => visibleIds.has(space.id));
  map.update({ visibleIds, availability, selectedId: state.selectedSpaceId });
  renderList(el.list, { spaces: visible, availability, selectedId: state.selectedSpaceId, sort: state.sort });
  renderIndexStrip(el.strip, availability, state.selectedSpaceId);
  syncFilters(el.filters, state.activeFilters);

  $$('[data-result-count]').forEach((node) => { node.textContent = pad(visible.length); });
  $$('[data-filter-badge]').forEach((node) => {
    const count = activeFilterCount(state.activeFilters);
    node.textContent = count ? `(${count})` : '';
  });
  el.network.classList.toggle('is-empty', visible.length === 0);
  el.network.dataset.layout = state.layout;
  $$('[data-layout-btn]').forEach((button) => {
    button.setAttribute('aria-selected', String(button.dataset.layoutBtn === state.layout));
    button.tabIndex = button.dataset.layoutBtn === state.layout ? 0 : -1;
  });
}

function renderDrawer() {
  const space = getSpace(state.selectedSpaceId);
  renderDetail(el.drawer, space, space ? availability.get(space.id) : null);
}

function applyDrawer() {
  const open = state.detailOpen && Boolean(state.selectedSpaceId);
  el.drawer.classList.toggle('is-open', open);
  el.drawer.inert = !open;
  el.drawer.setAttribute('aria-hidden', String(!open));
  el.body.classList.toggle('drawer-open', open);
  updateScrim();
  if (open) {
    // Small delay: the panel must finish switching to visibility: visible to accept focus.
    setTimeout(() => $('[data-drawer-close]', el.drawer).focus({ preventScroll: true }), 60);
    // Only the part of the map actually covered by the panel counts as inset.
    const mapRect = $('[data-map]').getBoundingClientRect();
    const inset = window.innerWidth < 1024
      ? { right: 0, bottom: Math.max(0, mapRect.bottom - (window.innerHeight - el.drawer.offsetHeight)) }
      : { right: Math.max(0, mapRect.right - (window.innerWidth - el.drawer.offsetWidth)), bottom: 0 };
    map.reveal(state.selectedSpaceId, inset);
    return;
  }
  map.setInset({ right: 0, bottom: 0 });
  if (lastTrigger && document.contains(lastTrigger) && el.drawer.contains(document.activeElement)) {
    lastTrigger.focus({ preventScroll: true });
  }
}

function updateScrim() {
  const show = filtersOpen || (state.detailOpen && window.innerWidth < 1024);
  el.scrim.classList.toggle('is-visible', show);
}

function renderNavCounts() {
  $$('[data-bookings-count]').forEach((node) => { node.textContent = pad(state.bookings.length); });
}

/* ---------------------------------------------------------------- views */

function applyView(view, { scroll = true } = {}) {
  $$('[data-views]').forEach((section) => {
    const visible = section.dataset.views.split(' ').includes(view);
    section.hidden = !visible;
    if (visible) {
      section.classList.remove('is-entering');
      void section.offsetWidth;
      section.classList.add('is-entering');
    }
  });
  el.body.dataset.view = view;
  $$('[data-nav]').forEach((link) => {
    if (link.dataset.nav === view) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (!['explore', 'spaces'].includes(view)) {
    setState({ detailOpen: false });
    setFiltersOpen(false);
  }
  if (scroll) window.scrollTo({ top: 0, behavior: 'auto' });
  document.title = `GARAGE//CITY — ${view === 'bookings' ? 'MY BOOKINGS' : view.toUpperCase()}`;
  observeReveals();
}

function route() {
  const hash = decodeURIComponent(location.hash.replace('#', ''));
  if (hash === 'main') return;
  if (hash === 'network') {
    if (state.currentView !== 'explore') setState({ currentView: 'explore' });
    scrollToNetwork();
    return;
  }
  const view = VIEWS.includes(hash) ? hash : 'explore';
  const patch = { currentView: view };
  if (view === 'spaces') patch.layout = 'list';
  if (view === 'explore' && state.currentView === 'spaces') patch.layout = 'map';
  setState(patch);
  if (hash && !VIEWS.includes(hash)) history.replaceState(null, '', '#explore');
  const heading = $(`[data-view-heading="${view}"]`);
  if (heading && state.currentView === view && hash) heading.focus({ preventScroll: true });
}

function scrollToNetwork() {
  requestAnimationFrame(() => {
    el.network.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  });
}

function go(view) {
  if (location.hash === `#${view}`) route();
  else location.hash = view;
}

/* ------------------------------------------------------------ selection */

function selectSpace(id, { openDetail = true, trigger = null } = {}) {
  const space = getSpace(id);
  if (!space) return;
  if (trigger) lastTrigger = trigger;
  if (!visibleIds.has(id)) {
    // Selected from the hero index while hidden by filters: clear them first.
    setState({ activeFilters: { ...DEFAULT_FILTERS } });
    toast('FILTER RESET', `Фильтры сброшены, чтобы показать ${space.code}`);
  }
  setState({ ...selectionForSpace(id), detailOpen: openDetail });
  if (state.currentView !== 'explore' && state.currentView !== 'spaces') go('explore');
}

function startBooking() {
  const space = getSpace(state.selectedSpaceId);
  if (!space) return;
  if (space.status === 'locked') {
    toast('SPACE UNAVAILABLE', space.statusNote || 'Бронирование закрыто', 'alert');
    return;
  }
  resetBookingUi();
  setState({ detailOpen: false });
  go('booking');
  requestAnimationFrame(() => {
    const target = $('#step-service button', el.booking);
    target?.focus({ preventScroll: true });
  });
}

function setFiltersOpen(open) {
  filtersOpen = open;
  el.filters.classList.toggle('is-open', open);
  $$('[data-action="open-filters"]').forEach((b) => b.setAttribute('aria-expanded', String(open)));
  updateScrim();
  if (open) $('.filters__close', el.filters)?.focus({ preventScroll: true });
}

function updateFilters(filters) {
  setState({ activeFilters: filters });
  if (state.selectedSpaceId && !visibleIds.has(state.selectedSpaceId)) {
    setState({ selectedSpaceId: null, detailOpen: false, selectedService: null, selectedTime: null, selectedExtras: [] });
    toast('SELECTION RESET', 'Выбранное пространство скрыто фильтром');
  }
}

/* ---------------------------------------------------------- confirmation */

function showConfirmation(booking) {
  const space = getSpace(booking.spaceId);
  const [h, m] = booking.time.split(':').map(Number);
  const endMinutes = h * 60 + m + booking.duration * 60;
  const end = `${pad(Math.floor(endMinutes / 60) % 24)}:${pad(endMinutes % 60)}`;
  const date = booking.date.split('-').reverse().slice(0, 2).join('.');
  $('[data-c-id]', el.confirm).textContent = booking.id;
  $('[data-c-space]', el.confirm).textContent = `${space.code} / ${space.name}`;
  $('[data-c-time]', el.confirm).textContent = `${date} · ${booking.time}—${end}`;
  $('[data-c-total]', el.confirm).textContent = `${formatNumber(booking.total)} ₽`;
  el.confirm.hidden = false;
  el.body.classList.add('confirm-open');
  requestAnimationFrame(() => {
    el.confirm.classList.add('is-open');
    $('[data-confirm-title]', el.confirm).focus({ preventScroll: true });
  });
}

function closeConfirmation() {
  if (el.confirm.hidden) return;
  el.confirm.classList.remove('is-open');
  el.body.classList.remove('confirm-open');
  el.confirm.hidden = true;
}

/* -------------------------------------------------------------- events */

function bindEvents() {
  window.addEventListener('hashchange', route);

  document.addEventListener('click', async (event) => {
    const selectButton = event.target.closest('[data-select-space]');
    if (selectButton && !el.booking.contains(selectButton)) {
      selectSpace(selectButton.dataset.selectSpace, { trigger: selectButton });
      if (selectButton.closest('[data-index-strip]')) scrollToNetwork();
      return;
    }

    const actionEl = event.target.closest('[data-action]');
    if (!actionEl) return;
    const action = actionEl.dataset.action;

    if (action === 'explore-network') {
      event.preventDefault();
      if (state.currentView !== 'explore') {
        history.pushState(null, '', '#explore');
        setState({ currentView: 'explore', layout: 'map' });
      }
      scrollToNetwork();
    } else if (action === 'close-drawer') {
      setState({ detailOpen: false });
    } else if (action === 'start-booking') {
      startBooking();
    } else if (action === 'open-filters') {
      setFiltersOpen(true);
    } else if (action === 'close-filters') {
      setFiltersOpen(false);
    } else if (action === 'reset-filters') {
      setState({ activeFilters: { ...DEFAULT_FILTERS } });
      toast('FILTER RESET', 'Показаны все пространства сети');
    } else if (action === 'open-bookings') {
      closeConfirmation();
      go('bookings');
    } else if (action === 'close-confirm') {
      closeConfirmation();
      $('#step-space', el.booking)?.scrollIntoView({ block: 'start' });
    } else if (action === 'reset-demo') {
      const ok = await confirmDialog({
        title: 'RESET DEMO?',
        message: 'Все брони будут удалены, фильтры и выбор — сброшены. Действие нельзя отменить.',
        confirmLabel: 'RESET DEMO',
        cancelLabel: 'KEEP DATA',
      });
      if (!ok) return;
      clearBookings();
      resetBookingUi();
      setState({
        bookings: [], activeFilters: { ...DEFAULT_FILTERS }, selectedSpaceId: null, detailOpen: false,
        selectedService: null, selectedTime: null, selectedDate: 0, duration: 2, selectedExtras: [], sort: 'code',
      });
      map.reset();
      toast('DEMO RESET', 'Исходные данные восстановлены');
    } else if (action === 'top') {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
      $('.brand')?.focus({ preventScroll: true });
    }
  });

  el.filters.addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    updateFilters(nextFilters(state.activeFilters, button.dataset.filter, button.dataset.value));
  });
  el.filters.addEventListener('change', (event) => {
    if (event.target.matches('[data-filter-select]')) {
      updateFilters({ ...state.activeFilters, [event.target.dataset.filterSelect]: event.target.value });
    }
  });

  el.list.addEventListener('click', (event) => {
    const sort = event.target.closest('[data-sort]');
    if (sort) setState({ sort: sort.dataset.sort });
  });
  const listHover = (event) => {
    const row = event.target.closest('.row');
    const enter = event.type === 'pointerover' || event.type === 'focusin';
    map.setHover(enter && row ? row.dataset.id : null);
  };
  ['pointerover', 'pointerout', 'focusin', 'focusout'].forEach((type) => el.list.addEventListener(type, listHover));

  $$('[data-layout-btn]').forEach((button) => {
    button.addEventListener('click', () => setState({ layout: button.dataset.layoutBtn }));
    button.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      const next = state.layout === 'map' ? 'list' : 'map';
      setState({ layout: next });
      $(`[data-layout-btn="${next}"]`).focus();
    });
  });

  el.scrim.addEventListener('click', () => {
    if (filtersOpen) setFiltersOpen(false);
    else setState({ detailOpen: false });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if ($('[data-dialog]')?.open) return;
    if (!el.confirm.hidden) closeConfirmation();
    else if (filtersOpen) {
      setFiltersOpen(false);
      $('[data-action="open-filters"]')?.focus();
    } else if (state.detailOpen) setState({ detailOpen: false });
  });

  window.addEventListener('resize', updateScrim, { passive: true });
}

function onStateChange(changed) {
  const has = (...keys) => keys.some((key) => changed.includes(key));
  if (has('activeFilters', 'bookings', 'tick')) compute();
  if (has('activeFilters', 'bookings', 'selectedSpaceId', 'sort', 'layout', 'tick')) renderNetwork();
  if (has('selectedSpaceId', 'bookings')) renderDrawer();
  if (has('detailOpen', 'selectedSpaceId')) applyDrawer();
  if (has('selectedSpaceId', 'selectedService', 'selectedDate', 'selectedTime', 'duration', 'selectedExtras', 'bookings', 'tick')) renderBooking();
  if (has('bookings', 'tick')) renderPasses(el.passes);
  if (has('bookings')) renderNavCounts();
  if (has('currentView')) applyView(state.currentView);
}

/* ---------------------------------------------------------------- boot */

function reportStorage(status) {
  if (status === 'unavailable') {
    el.storageNote.hidden = false;
    toast('STORAGE OFFLINE', 'Брони будут работать до перезагрузки страницы', 'alert');
  } else if (status === 'corrupt') {
    toast('STORAGE RECOVERED', 'Повреждённые данные проигнорированы', 'alert');
  } else if (status === 'repaired') {
    toast('STORAGE RECOVERED', 'Часть некорректных записей пропущена', 'alert');
  }
}

function boot() {
  renderFilters(el.filters);
  initHero($('[data-hero]'));
  map = new CityMap($('[data-map]'), {
    onSelect: (id) => selectSpace(id, { trigger: $(`.marker[data-id="${id}"]`) }),
    onHover: (id) => {
      $$('.row', el.list).forEach((row) => row.classList.toggle('is-hover', row.dataset.id === id));
    },
  });
  map.setSpaces(SPACES);
  initListPreview(el.list, getSpace);
  initBooking(el.booking, { onConfirmed: showConfirmation });
  initPasses(el.passes);
  initCursor();
  bindImageFallbacks();
  startClock();

  const { bookings, status } = loadBookings();
  state.bookings = bookings;
  compute();
  subscribe(onStateChange);
  bindEvents();

  renderNetwork();
  renderDrawer();
  applyDrawer();
  renderBooking();
  renderPasses(el.passes);
  renderNavCounts();
  route();
  applyView(state.currentView, { scroll: false });
  reportStorage(status);

  setInterval(() => notify(['tick']), TICK_MS);
  requestAnimationFrame(() => el.body.classList.remove('is-loading'));
}

boot();
