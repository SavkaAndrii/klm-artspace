import { createDemoStore, SERVICES, STATUS, studioName, dateKey, dateLabel, isAvailable } from './demo-data.js';
import { Calendar } from './calendar.js';

/** Owner UI only: no authentication and no persistent or shared state. */
export function initPanel(toast) {
  const store = createDemoStore();
  const state = { studio: 'space-1', view: 'overview', mode: 'block', editing: null };
  const hoursForm = document.querySelector('#hours-form');
  const settingsForm = document.querySelector('#settings-form');
  const dialog = document.querySelector('#edit-dialog');
  const editForm = document.querySelector('#edit-form');
  const config = () => store.availability[state.studio];
  document.querySelector('[data-today]').textContent = store.today.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const calendarOptions = {
    today: store.today, owner: true,
    available: key => isAvailable(store, state.studio, key),
    selected: key => config().blocked.has(key) || config().extra.has(key),
  };
  const overviewCalendar = new Calendar(document.querySelector('#overview-calendar'), {
    ...calendarOptions,
    onSelect: key => {
      availabilityCalendar.month = new Date(`${key.slice(0, 7)}-01T12:00:00`);
      availabilityCalendar.render();
      showView('availability');
    },
  });
  const availabilityCalendar = new Calendar(document.querySelector('#availability-calendar'), {
    ...calendarOptions,
    onSelect: key => {
      const selected = state.mode === 'block' ? config().blocked : config().extra;
      const other = state.mode === 'block' ? config().extra : config().blocked;
      if (selected.has(key)) selected.delete(key);
      else selected.add(key);
      other.delete(key);
      overviewCalendar.render();
      toast(`Zmieniono przykładową dostępność ${studioName(state.studio)}. Bez zapisu.`);
    },
  });

  function showView(view, focus = true) {
    state.view = view;
    document.querySelectorAll('[data-panel-view]').forEach(section => { section.hidden = section.dataset.panelView !== view; });
    document.querySelectorAll('.sidebar [data-view]').forEach(button => {
      const selected = button.dataset.view === view;
      button.classList.toggle('active', selected);
      if (selected) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    if (focus) document.querySelector(`[data-panel-view="${view}"] h1`).focus();
  }

  function renderRequests() {
    document.querySelectorAll('[data-requests]').forEach(list => {
      const fragment = document.createDocumentFragment();
      store.requests.forEach(request => {
        const row = document.querySelector('#request-template').content.cloneNode(true);
        row.querySelector('.booking-row').dataset.request = request.id;
        row.querySelector('.booking-row__name').textContent = request.name;
        row.querySelector('.booking-row__details').textContent = `${studioName(request.studio)} · ${SERVICES[request.service]}\n${dateLabel(request.date)} · ${request.time}`;
        const contact = row.querySelector('.booking-row__contact');
        contact.hidden = list.dataset.requests !== 'bookings';
        contact.textContent = `${request.email}\n${request.phone}`;
        const status = row.querySelector('.status');
        status.classList.add(`status--${request.status}`);
        status.textContent = STATUS[request.status];
        status.tabIndex = -1;
        row.querySelectorAll('[data-action]').forEach(button => {
          const isPendingAction = ['approved', 'rejected'].includes(button.dataset.action);
          button.hidden = isPendingAction ? request.status !== 'pending' : request.status !== 'approved';
        });
        fragment.append(row);
      });
      list.replaceChildren(fragment);
    });
    const active = store.requests.filter(r => ['pending', 'approved'].includes(r.status));
    const today = active.filter(r => r.date === dateKey(store.today));
    const counts = { upcoming: active.length, pending: store.requests.filter(r => r.status === 'pending').length, today: today.length };
    document.querySelectorAll('[data-count]').forEach(element => { element.textContent = String(counts[element.dataset.count]).padStart(2, '0'); });
    document.querySelector('#today-schedule').textContent = today.length ? today.map(r => `${studioName(r.studio)} · ${r.time} · ${r.name}`).join('\n') : 'Dzisiaj nie ma rezerwacji w przykładowym grafiku.';
  }

  function renderStudio() {
    document.querySelectorAll('[data-owner-studio]').forEach(select => { select.value = state.studio; });
    document.querySelectorAll('[data-weekday]').forEach(button => {
      const selected = config().working.has(Number(button.dataset.weekday));
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    for (const [name, value] of Object.entries(config().hours)) hoursForm.elements.namedItem(name).value = value;
    settingsForm.reset();
    for (const [name, value] of Object.entries(config().settings)) settingsForm.elements.namedItem(name).value = value;
    // reset() restores the studio selector too; synchronize it after resetting.
    document.querySelectorAll('[data-owner-studio]').forEach(select => { select.value = state.studio; });
    overviewCalendar.render();
    availabilityCalendar.render();
  }

  document.querySelector('.dashboard__inner').addEventListener('click', event => {
    const view = event.target.closest('[data-view]');
    if (view) showView(view.dataset.view);
    const weekday = event.target.closest('[data-weekday]');
    if (weekday) {
      const day = Number(weekday.dataset.weekday);
      config().working.has(day) ? config().working.delete(day) : config().working.add(day);
      weekday.classList.toggle('is-selected', config().working.has(day));
      weekday.setAttribute('aria-pressed', String(config().working.has(day)));
      overviewCalendar.render();
      availabilityCalendar.render();
    }
    const action = event.target.closest('[data-action]');
    if (!action) return;
    const request = store.requests.find(item => item.id === Number(action.closest('[data-request]').dataset.request));
    if (action.dataset.action === 'edit') {
      state.editing = request.id;
      editForm.elements.date.min = dateKey(store.today);
      editForm.elements.date.value = request.date;
      editForm.elements.time.value = request.time;
      dialog.showModal();
      return;
    }
    request.status = action.dataset.action;
    renderRequests();
    document.querySelector(`[data-panel-view="${state.view}"] [data-request="${request.id}"] .status`)?.focus({ preventScroll: true });
    toast('Zmieniono wyłącznie przykładowy status. Nic nie wysłano ani nie zapisano.');
  });
  document.querySelectorAll('[data-owner-studio]').forEach(select => {
    select.addEventListener('change', () => { state.studio = select.value; renderStudio(); });
  });
  document.querySelector('#availability-mode').addEventListener('change', event => { state.mode = event.target.value; });
  hoursForm.addEventListener('submit', event => {
    event.preventDefault();
    const hours = Object.fromEntries(new FormData(hoursForm));
    const end = hoursForm.elements.end;
    end.setCustomValidity(hours.start >= hours.end ? 'Godzina końcowa musi być późniejsza od początkowej.' : '');
    if (!hoursForm.reportValidity()) return;
    config().hours = hours;
    toast(`Zastosowano przykładowe godziny i przerwę dla ${studioName(state.studio)}. Bez zapisu.`);
  });
  hoursForm.addEventListener('input', () => hoursForm.elements.end.setCustomValidity(''));
  settingsForm.addEventListener('submit', event => {
    event.preventDefault();
    config().settings = Object.fromEntries(new FormData(settingsForm));
    toast(`Zastosowano przykładowe ustawienia ${studioName(state.studio)}. Bez zapisu.`);
  });
  document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
  editForm.addEventListener('submit', event => {
    event.preventDefault();
    const request = store.requests.find(item => item.id === state.editing);
    request.date = editForm.elements.date.value;
    request.time = editForm.elements.time.value;
    dialog.close();
    renderRequests();
    document.querySelector(`[data-panel-view="${state.view}"] [data-request="${request.id}"] [data-action="edit"]`)?.focus({ preventScroll: true });
    toast('Zmieniono wyłącznie przykładowy termin.');
  });
  renderRequests();
  renderStudio();
  showView('overview', false);
}
