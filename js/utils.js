export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export const pad = (value, length = 2) => String(value).padStart(length, '0');
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const numberFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
export const formatNumber = (value) => numberFormat.format(Math.round(value)).replace(/\s/g, ' ');
export const formatPrice = (value) => `${formatNumber(value)} ₽`;

export const toMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};
export const fromMinutes = (total) => {
  const minutes = ((total % 1440) + 1440) % 1440;
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
};
export const nowMinutes = (now = new Date()) => now.getHours() * 60 + now.getMinutes();

export const dayDate = (offset, now = new Date()) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
export const isoDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
export const parseIso = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const shortDate = (date) => `${pad(date.getDate())}.${pad(date.getMonth() + 1)}`;
export const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isDesktopPointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
export const isMobile = () => window.matchMedia('(max-width: 767px)').matches;

export const plural = (count, one, few, many) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
};
