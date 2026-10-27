// Minimal observable store. Every UI module reads from `state` and re-renders
// when one of the keys it depends on changes.

export const DEFAULT_FILTERS = Object.freeze({
  need: null,
  type: 'all',
  price: 'all',
  availability: 'all',
  district: 'all',
});

export const state = {
  currentView: 'explore',
  layout: 'map',
  sort: 'code',
  selectedSpaceId: null,
  detailOpen: false,
  activeFilters: { ...DEFAULT_FILTERS },
  selectedService: null,
  selectedDate: 0,
  selectedTime: null,
  duration: 2,
  selectedExtras: [],
  bookings: [],
};

const listeners = new Set();

export function setState(patch) {
  const changed = Object.keys(patch).filter((key) => state[key] !== patch[key]);
  if (!changed.length) return;
  Object.assign(state, patch);
  listeners.forEach((listener) => listener(changed));
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// The current time also changes what is bookable, so modules can request a
// refresh without mutating state.
export function notify(keys) {
  listeners.forEach((listener) => listener(keys));
}
