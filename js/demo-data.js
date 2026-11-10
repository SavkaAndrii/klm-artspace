/** In-memory demo adapter. Replace with an authenticated server API during migration.
 * No fetch, cookies, localStorage, sessionStorage, or database writes occur here.
 * Server integration must validate studio, hours, duration, buffer, overlaps and status
 * atomically. Browser availability is presentation only, never authoritative.
 */
export const STUDIOS = [
  { id: 'space-1', name: 'Space 1' },
  { id: 'space-2', name: 'Space 2' },
  { id: 'space-3', name: 'Space 3' },
];
export const SERVICES = ['Wynajem studia fotograficznego', 'Sesje zdjęciowe', 'Warsztaty i wydarzenia'];
export const SLOTS = ['09:00–11:00', '11:30–13:30', '14:00–16:00', '16:30–18:30'];
export const STATUS = { pending: 'Oczekuje — demo', approved: 'Zaakceptowano — demo', rejected: 'Odrzucono — demo', cancelled: 'Anulowano — demo' };

export function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function parseDate(value) {
  return new Date(`${value}T12:00:00`);
}
export function dateLabel(value) {
  return value ? parseDate(value).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Wybierz datę';
}
export function createDemoStore() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const future = days => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return dateKey(d);
  };
  const availability = Object.fromEntries(STUDIOS.map(studio => [studio.id, {
    working: new Set([0, 1, 2, 3, 4]), blocked: new Set(), extra: new Set(),
    hours: { start: '09:00', end: '18:30', buffer: '30', blockedSlot: '' }, settings: {},
  }]));
  return {
    today, availability,
    requests: [
      { id: 1, studio: 'space-1', name: 'Osoba przykładowa A', service: 0, date: future(2), time: SLOTS[0], status: 'pending', email: 'osoba-a@example.com', phone: 'Numer przykładowy — brak' },
      { id: 2, studio: 'space-2', name: 'Osoba przykładowa B', service: 1, date: future(3), time: SLOTS[2], status: 'approved', email: 'osoba-b@example.com', phone: 'Numer przykładowy — brak' },
      { id: 3, studio: 'space-3', name: 'Osoba przykładowa C', service: 0, date: future(6), time: SLOTS[0], status: 'pending', email: 'osoba-c@example.com', phone: 'Numer przykładowy — brak' },
    ],
  };
}
export function isAvailable(store, studio, key) {
  const date = parseDate(key);
  if (date < store.today) return false;
  const config = store.availability[studio];
  if (config.blocked.has(key)) return false;
  if (config.extra.has(key)) return true;
  return config.working.has((date.getDay() + 6) % 7) && date.getDate() % 7 !== 4;
}
export function studioName(id) {
  return STUDIOS.find(studio => studio.id === id)?.name || STUDIOS[0].name;
}
