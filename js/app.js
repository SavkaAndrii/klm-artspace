import { initBooking } from './booking.js';
import { initPanel } from './panel.js';

const menuButton = document.querySelector('.menu__button');
const menuBody = document.querySelector('.menu__body');
const header = document.querySelector('.header');
const mobile = window.matchMedia('(max-width: 43.75rem)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let toastTimer;

export function toast(message) {
  const element = document.querySelector('#toast');
  element.textContent = message;
  element.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('is-visible'), 3500);
}

function closeMenu(returnFocus = false) {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Otwórz menu');
  menuBody.classList.remove('is-open');
  document.body.classList.remove('_lock');
  if (returnFocus) menuButton.focus();
}

function scrollToSection(section, smooth = true, focus = true) {
  closeMenu();
  const gotoBlockValue = section.getBoundingClientRect().top + window.scrollY - header.offsetHeight;
  window.scrollTo({ top: Math.max(0, gotoBlockValue), behavior: smooth && !reducedMotion.matches ? 'smooth' : 'instant' });
  if (focus) {
    const heading = section.querySelector('h2') || section;
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }
}

function scrollToHash() {
  if (!location.hash) return;
  let id;
  try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
  const section = document.getElementById(id);
  if (section) scrollToSection(section, false, false);
}

function initNavigation() {
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    if (!open) return closeMenu();
    menuButton.setAttribute('aria-expanded', 'true');
    menuButton.setAttribute('aria-label', 'Zamknij menu');
    menuBody.classList.add('is-open');
    document.body.classList.add('_lock');
  });

  // One delegated listener; regular links retain native page and browser history behavior.
  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-goto]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.querySelector(link.dataset.goto);
    closeMenu();
    if (!target) return; // From a subpage the relative HTML link opens the homepage.
    event.preventDefault();
    const hash = `#${target.id}`;
    if (location.hash !== hash) history.pushState({ section: target.id }, '', hash);
    scrollToSection(target);
  });
  document.addEventListener('keydown', event => {
    if (menuButton.getAttribute('aria-expanded') !== 'true') return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu(true);
    }
    if (event.key === 'Tab' && mobile.matches) {
      const items = [menuButton, ...menuBody.querySelectorAll('a')];
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  document.addEventListener('click', event => {
    if (!header.contains(event.target) && menuButton.getAttribute('aria-expanded') === 'true') closeMenu(true);
  });
  mobile.addEventListener('change', () => closeMenu());
  window.addEventListener('popstate', () => {
    closeMenu();
    requestAnimationFrame(scrollToHash);
  });
  window.addEventListener('pageshow', () => {
    closeMenu();
    requestAnimationFrame(scrollToHash);
  });
  // Native anchors are the no-JS fallback. JS owns scrolling only after initialization.
  requestAnimationFrame(scrollToHash);
}

function initSpaceTabs() {
  const tablist = document.querySelector('.space__tabs');
  if (!tablist) return;
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  const activate = (tab, focus = false) => {
    tabs.forEach(item => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
    });
    if (focus) tab.focus();
  };
  tablist.addEventListener('click', event => {
    const tab = event.target.closest('[role="tab"]');
    if (tab) activate(tab);
  });
  tablist.addEventListener('keydown', event => {
    const index = tabs.indexOf(event.target);
    if (index < 0) return;
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); activate(tabs[next], true); }
  });
}

initNavigation();
initSpaceTabs();
if (document.body.dataset.page === 'booking') initBooking(toast);
if (document.body.dataset.page === 'panel') initPanel(toast);
