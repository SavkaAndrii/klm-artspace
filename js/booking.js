import { createDemoStore, STUDIOS, SERVICES, SLOTS, studioName, dateLabel, isAvailable } from './demo-data.js';
import { Calendar } from './calendar.js';

/** One booking controller on the dedicated page. Homepage selection uses a GET link. */
export function initBooking(toast) {
  const store = createDemoStore();
  const params = new URLSearchParams(location.search);
  const selectedStudio = params.get('studio');
  const service = params.get('usluga');
  const state = {
    studio: STUDIOS.some(s => s.id === selectedStudio) ? selectedStudio : STUDIOS[0].id,
    service: ['0', '1', '2'].includes(service) ? Number(service) : 0,
    date: null, time: null, step: 0,
  };
  const booking = document.querySelector('#booking');
  const details = document.querySelector('#booking-details');
  const slots = document.querySelector('#booking-slots');
  const next = document.querySelector('#booking-next');
  const result = document.querySelector('#booking-result');
  const calendar = new Calendar(document.querySelector('#booking-calendar'), {
    today: store.today,
    available: key => isAvailable(store, state.studio, key),
    selected: key => state.date === key,
    onSelect: key => { state.date = key; state.time = null; render(); },
  });

  function updateSummary() {
    const summary = { studio: studioName(state.studio), service: SERVICES[state.service], date: dateLabel(state.date), time: state.time || 'Wybierz godzinę' };
    document.querySelectorAll('[data-summary]').forEach(element => { element.textContent = summary[element.dataset.summary]; });
  }

  function render() {
    document.querySelectorAll('[data-studio], [data-service]').forEach(button => {
      const selected = button.hasAttribute('data-studio') ? button.dataset.studio === state.studio : Number(button.dataset.service) === state.service;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    document.querySelector('#slots-hint').hidden = Boolean(state.date);
    slots.hidden = !state.date;
    slots.replaceChildren();
    if (state.date) SLOTS.forEach((time, index) => {
      const button = document.createElement('button');
      button.className = 'slot';
      button.type = 'button';
      button.textContent = time;
      button.dataset.slot = time;
      button.disabled = index === 1; // Explicitly fictional occupied time.
      button.classList.toggle('is-selected', state.time === time);
      button.setAttribute('aria-pressed', String(state.time === time));
      slots.append(button);
    });
    next.disabled = !state.date || !state.time;
    updateSummary();
  }

  function showStep(step) {
    state.step = step;
    document.querySelectorAll('[data-booking-step]').forEach(view => { view.hidden = Number(view.dataset.bookingStep) !== step; });
    document.querySelectorAll('.steps li').forEach((item, index) => {
      item.classList.toggle('active', index === step);
      if (index === step) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
    const heading = document.querySelector(`[data-booking-step="${step}"] h2`);
    heading.tabIndex = -1;
    heading.focus();
  }

  booking.addEventListener('click', event => {
    const studio = event.target.closest('[data-studio]');
    if (studio) {
      state.studio = studio.dataset.studio;
      state.date = state.time = null;
      calendar.render();
      render();
    }
    const service = event.target.closest('[data-service]');
    if (service) { state.service = Number(service.dataset.service); render(); }
    const slot = event.target.closest('[data-slot]');
    if (slot && !slot.disabled) {
      state.time = slot.dataset.slot;
      render();
      slots.querySelector(`[data-slot="${state.time}"]`).focus({ preventScroll: true });
    }
    if (event.target.closest('[data-back]')) showStep(state.step - 1);
  });
  next.addEventListener('click', () => {
    if (!state.date || !state.time) return;
    showStep(1);
  });
  details.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(details);
    document.querySelectorAll('[data-customer]').forEach(element => { element.textContent = data.get(element.dataset.customer); });
    showStep(2);
  });
  document.querySelector('#booking-submit').addEventListener('click', () => {
    booking.hidden = true;
    document.querySelector('#booking-heading').hidden = true;
    result.hidden = false;
    updateSummary();
    // Clear temporary contact data as soon as the preview is complete.
    details.reset();
    document.querySelectorAll('[data-customer]').forEach(element => { element.textContent = ''; });
    document.querySelector('#result-title').focus();
    toast('To podgląd. Nic nie wysłano ani nie zapisano.');
  });
  document.querySelector('#booking-restart').addEventListener('click', () => {
    state.date = state.time = null;
    result.hidden = true;
    booking.hidden = false;
    document.querySelector('#booking-heading').hidden = false;
    calendar.render();
    render();
    showStep(0);
  });
  // Do not retain typed contact data in a back/forward cache.
  window.addEventListener('pagehide', () => {
    details.reset();
    document.querySelectorAll('[data-customer]').forEach(element => { element.textContent = ''; });
  });
  window.addEventListener('pageshow', event => { if (event.persisted && state.step === 2) showStep(1); });
  render();
}
