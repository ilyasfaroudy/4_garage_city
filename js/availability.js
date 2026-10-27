import { SLOT_TIMES } from './data.js';
import { dayDate, isoDate, toMinutes, nowMinutes } from './utils.js';

export const DAY_OFFSETS = [0, 1, 2];
export const DAY_LABELS = ['TODAY', 'TOMORROW', '+2 DAYS'];
const DAY_SHORT = ['TODAY', 'TMRW', '+2D'];

export function bookingCoversSlot(booking, time) {
  const slot = toMinutes(time);
  const start = toMinutes(booking.time);
  return slot >= start && slot < start + booking.duration * 60;
}

/** free | booked | yours | past | locked */
export function slotStatus(space, offset, time, bookings, now = new Date()) {
  if (space.status === 'locked') return 'locked';
  const date = isoDate(dayDate(offset, now));
  const mine = bookings.some((b) => b.spaceId === space.id && b.date === date && bookingCoversSlot(b, time));
  if (mine) return 'yours';
  const open = space.availableSlots?.[offset] ?? [];
  if (!open.includes(time)) return 'booked';
  if (offset === 0 && toMinutes(time) <= nowMinutes(now)) return 'past';
  return 'free';
}

export const daySlots = (space, offset, bookings, now = new Date()) =>
  SLOT_TIMES.map((time) => ({ time, status: slotStatus(space, offset, time, bookings, now) }));

export function spaceAvailability(space, bookings, now = new Date()) {
  const todayIso = isoDate(dayDate(0, now));
  const hasPass = bookings.some((b) => b.spaceId === space.id && b.date >= todayIso);
  if (space.status === 'locked') {
    return { state: 'locked', label: 'LOCKED', nextLabel: 'UNAVAILABLE', next: null, freeToday: [], hasPass };
  }

  const today = daySlots(space, 0, bookings, now);
  const freeToday = today.filter((s) => s.status === 'free').map((s) => s.time);
  const remainingToday = today.filter((s) => s.status !== 'past');

  let next = null;
  for (const offset of DAY_OFFSETS) {
    const slots = offset === 0 ? today : daySlots(space, offset, bookings, now);
    const free = slots.find((s) => s.status === 'free');
    if (free) {
      next = { offset, time: free.time };
      break;
    }
  }

  const full = !next || (!freeToday.length && remainingToday.length > 0);
  const nextLabel = next ? `${DAY_SHORT[next.offset]} ${next.time}` : 'NO SLOTS';
  let label;
  if (!next) label = 'FULLY BOOKED';
  else if (full) label = 'BOOKED TODAY';
  else label = next.offset === 0 ? `AVAILABLE ${next.time}` : `NEXT ${nextLabel}`;

  return { state: full ? 'full' : 'available', label, nextLabel, next, freeToday, hasPass };
}

/** Slot starts (other than the first) that a booking of `duration` would run into. */
export function findConflict(space, offset, time, duration, bookings, now = new Date()) {
  const start = toMinutes(time);
  const end = start + duration * 60;
  return SLOT_TIMES.find((slot) => {
    const minutes = toMinutes(slot);
    if (minutes <= start || minutes >= end) return false;
    const status = slotStatus(space, offset, slot, bookings, now);
    return status === 'booked' || status === 'yours';
  }) || null;
}
