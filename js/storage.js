import { SLOT_TIMES, getSpace, getService, getExtra } from './data.js';

export const STORAGE_KEY = 'garageCityBookings';

let available = null;

export function isStorageAvailable() {
  if (available !== null) return available;
  try {
    const probe = '__garageCityProbe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    available = true;
  } catch {
    available = false;
  }
  return available;
}

function isValidBooking(item) {
  if (!item || typeof item !== 'object') return false;
  const space = getSpace(item.spaceId);
  return (
    typeof item.id === 'string' && /^GC-\d{6}-\d{3}$/.test(item.id) &&
    Boolean(space) &&
    Boolean(getService(item.serviceId)) && space.services.includes(item.serviceId) &&
    typeof item.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
    SLOT_TIMES.includes(item.time) &&
    Number.isInteger(item.duration) && item.duration >= 1 && item.duration <= 6 &&
    Array.isArray(item.extras) &&
    Number.isFinite(item.total) && item.total > 0
  );
}

/**
 * Restores bookings without ever throwing: corrupted JSON or foreign records
 * are dropped and reported through `status` so the UI can inform the user.
 */
export function loadBookings() {
  if (!isStorageAvailable()) return { bookings: [], status: 'unavailable' };
  let raw;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return { bookings: [], status: 'unavailable' };
  }
  if (raw === null) return { bookings: [], status: 'empty' };
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('Bookings must be an array');
    const bookings = parsed.filter(isValidBooking).map((item) => ({
      ...item,
      extras: item.extras.filter((id) => getExtra(id)),
    }));
    const unique = bookings.filter((item, index) => bookings.findIndex((b) => b.id === item.id) === index);
    return { bookings: unique, status: unique.length === parsed.length ? 'ok' : 'repaired' };
  } catch {
    return { bookings: [], status: 'corrupt' };
  }
}

export function saveBookings(bookings) {
  if (!isStorageAvailable()) return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    return true;
  } catch {
    return false;
  }
}

export function clearBookings() {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage became unavailable — nothing to clear */
  }
}
