import { escapeHtml, isDesktopPointer, pad, reducedMotion } from './utils.js';

/* ---------------------------------------------------------------- toasts */

let toastCounter = 0;
const MAX_TOASTS = 3;

export function toast(title, message = '', tone = 'info') {
  const root = document.querySelector('[data-toasts]');
  if (!root) return;
  toastCounter += 1;
  const item = document.createElement('div');
  item.className = `toast toast--${tone}`;
  item.setAttribute('role', tone === 'alert' ? 'alert' : 'status');
  item.innerHTML = `
    <span class="toast__code">SYS/${pad(toastCounter, 3)}</span>
    <span class="toast__title">${escapeHtml(title)}</span>
    ${message ? `<span class="toast__msg">${escapeHtml(message)}</span>` : ''}
    <span class="toast__timer" aria-hidden="true"></span>`;
  root.prepend(item);
  [...root.children].slice(MAX_TOASTS).forEach((old) => old.remove());
  requestAnimationFrame(() => item.classList.add('is-in'));
  const remove = () => {
    item.classList.remove('is-in');
    item.classList.add('is-out');
    setTimeout(() => item.remove(), 400);
  };
  setTimeout(remove, tone === 'alert' ? 5200 : 3400);
}

/* ------------------------------------------------------- confirm dialog */

export function confirmDialog({ title, message, confirmLabel = 'CONFIRM', cancelLabel = 'CANCEL' }) {
  const dialog = document.querySelector('[data-dialog]');
  if (!dialog || typeof dialog.showModal !== 'function') {
    return Promise.resolve(window.confirm(`${title}\n${message}`));
  }
  dialog.querySelector('[data-dialog-title]').textContent = title;
  dialog.querySelector('[data-dialog-text]').textContent = message;
  dialog.querySelector('[data-dialog-confirm]').textContent = confirmLabel;
  dialog.querySelector('[data-dialog-cancel]').textContent = cancelLabel;
  return new Promise((resolve) => {
    const onClose = () => {
      dialog.removeEventListener('close', onClose);
      resolve(dialog.returnValue === 'confirm');
    };
    dialog.addEventListener('close', onClose);
    dialog.returnValue = '';
    dialog.showModal();
    dialog.querySelector('[data-dialog-cancel]').focus();
  });
}

/* -------------------------------------------------------- rolling price */

/**
 * Renders a number as a set of vertical digit reels so that changes "roll"
 * instead of jumping. Non-digit characters (spaces, ₽) are rendered as-is.
 */
export function rollNumber(el, text) {
  if (!el || el.dataset.value === text) return;
  const previous = el.dataset.value || '';
  el.dataset.value = text;
  el.setAttribute('aria-label', text);
  const structureChanged = previous.length !== text.length ||
    [...text].some((ch, i) => /\d/.test(ch) !== /\d/.test(previous[i] ?? ''));

  if (structureChanged) {
    el.innerHTML = [...text].map((ch) => (/\d/.test(ch)
      ? `<span class="reel" aria-hidden="true"><span class="reel__strip" style="--d:${previous ? 0 : ch}">${'0123456789'.split('').map((d) => `<span>${d}</span>`).join('')}</span></span>`
      : `<span class="reel-sep" aria-hidden="true">${ch === ' ' ? ' ' : escapeHtml(ch)}</span>`)).join('');
  }
  const strips = el.querySelectorAll('.reel__strip');
  const digits = [...text].filter((ch) => /\d/.test(ch));
  requestAnimationFrame(() => {
    strips.forEach((strip, i) => strip.style.setProperty('--d', digits[i]));
  });
}

/* ------------------------------------------------------- custom cursor */

const CURSOR_LABELS = {
  view: 'VIEW ↗',
  select: 'SELECT +',
  drag: 'DRAG ↔',
  book: 'BOOK →',
  close: 'CLOSE ×',
};

export function initCursor() {
  const cursor = document.querySelector('[data-cursor-el]');
  if (!cursor || !isDesktopPointer()) return;
  document.documentElement.classList.add('has-cursor');
  const label = cursor.querySelector('.cursor__label');
  const pos = { x: -100, y: -100, tx: -100, ty: -100 };
  let frame = null;
  let current = '';

  const render = () => {
    frame = null;
    const ease = reducedMotion() ? 1 : 0.28;
    pos.x += (pos.tx - pos.x) * ease;
    pos.y += (pos.ty - pos.y) * ease;
    cursor.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0)`;
    if (Math.abs(pos.tx - pos.x) > 0.1 || Math.abs(pos.ty - pos.y) > 0.1) frame = requestAnimationFrame(render);
  };

  document.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    pos.tx = event.clientX;
    pos.ty = event.clientY;
    cursor.classList.add('is-visible');
    if (!frame) frame = requestAnimationFrame(render);
  }, { passive: true });

  document.addEventListener('pointerover', (event) => {
    const target = event.target.closest('[data-cursor], a, button, select, [role="button"]');
    let mode = target?.dataset.cursor || (target ? 'link' : '');
    if (target?.matches('[aria-disabled="true"], :disabled')) mode = 'blocked';
    if (mode === current) return;
    current = mode;
    cursor.dataset.mode = mode;
    label.textContent = CURSOR_LABELS[mode] || '';
  });

  document.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
  document.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
  document.documentElement.addEventListener('mouseleave', () => cursor.classList.remove('is-visible'));
}

/* ---------------------------------------------------- scroll reveal */

let revealObserver = null;

export function observeReveals(root = document) {
  const items = root.querySelectorAll('[data-reveal]:not(.is-in)');
  if (!('IntersectionObserver' in window) || reducedMotion()) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }
  revealObserver ??= new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      revealObserver.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  items.forEach((el) => revealObserver.observe(el));
}

/* ------------------------------------------------------------- images */

/** <img> with a graphic fallback, so a missing file never leaves a hole. */
export function spaceImage(space, className = '') {
  const alt = `${space.code} ${space.name} — ${space.district}`;
  const fallback = `<span class="img-fallback" aria-hidden="true"><span>${space.code}</span><span>${escapeHtml(space.name)}</span></span>`;
  if (!space.image) return `<span class="img-frame ${className} is-missing">${fallback}</span>`;
  return `<span class="img-frame ${className}"><img src="${space.image}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async">${fallback}</span>`;
}

export function bindImageFallbacks(root = document) {
  root.addEventListener('error', (event) => {
    if (event.target.tagName === 'IMG') event.target.closest('.img-frame')?.classList.add('is-missing');
  }, true);
}
