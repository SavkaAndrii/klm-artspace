import { dateKey } from './demo-data.js';

/** Shared interactive calendar. Only date cells are generated; its markup lives in HTML. */
export class Calendar {
  constructor(host, { today, available, selected = () => false, owner = false, onSelect }) {
    this.host = host;
    this.month = new Date(today.getFullYear(), today.getMonth(), 1);
    this.available = available;
    this.selected = selected;
    this.owner = owner;
    this.onSelect = onSelect;
    host.append(document.querySelector('#calendar-template').content.cloneNode(true));
    this.grid = host.querySelector('.calendar__grid');
    host.addEventListener('click', event => {
      const monthButton = event.target.closest('[data-month]');
      if (monthButton) {
        this.month.setMonth(this.month.getMonth() + Number(monthButton.dataset.month));
        this.render();
      }
      const day = event.target.closest('[data-date]');
      if (day && !day.disabled) {
        this.onSelect(day.dataset.date);
        this.render();
        this.grid.querySelector(`[data-date="${day.dataset.date}"]`)?.focus({ preventScroll: true });
      }
    });
    this.grid.addEventListener('keydown', event => {
      if (!event.target.matches('[data-date]')) return;
      const buttons = [...this.grid.querySelectorAll('[data-date]')];
      const index = buttons.indexOf(event.target);
      const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
      let target;
      if (event.key in moves) target = index + moves[event.key];
      if (event.key === 'Home') target = 0;
      if (event.key === 'End') target = buttons.length - 1;
      if (target === undefined) return;
      event.preventDefault();
      const direction = target < index ? -1 : 1;
      while (buttons[target]?.disabled) target += direction;
      buttons[target]?.focus();
    });
    this.render();
  }

  render() {
    this.host.querySelector('.calendar__month').textContent = this.month.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
    this.grid.querySelectorAll('[data-date], .calendar__empty').forEach(cell => cell.remove());
    const fragment = document.createDocumentFragment();
    const offset = (this.month.getDay() + 6) % 7;
    const count = new Date(this.month.getFullYear(), this.month.getMonth() + 1, 0).getDate();
    for (let i = 0; i < offset; i++) {
      const empty = document.createElement('span');
      empty.className = 'calendar__empty';
      empty.setAttribute('aria-hidden', 'true');
      fragment.append(empty);
    }
    for (let day = 1; day <= count; day++) {
      const date = new Date(this.month.getFullYear(), this.month.getMonth(), day);
      const key = dateKey(date);
      const available = this.available(key);
      const selected = this.selected(key);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'calendar__day';
      button.classList.toggle('is-selected', selected);
      button.classList.toggle('is-unavailable', !available);
      button.dataset.date = key;
      button.textContent = day;
      button.disabled = !this.owner && !available;
      button.setAttribute('aria-pressed', String(selected));
      button.setAttribute('aria-label', `${date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}${!available ? ', niedostępny' : ''}`);
      fragment.append(button);
    }
    this.grid.append(fragment);
  }
}
