import type { Birthday, Reminder } from './types';

export const pad = (n: number) => String(n).padStart(2, '0');
export const DAY = 86400000;

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes());
export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
export const dayDiff = (a: Date, b: Date) =>
  Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / DAY);
export const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
export const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DOW_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const MON_SHORT = MONTHS.map((m) => m.slice(0, 3));

export function fmtTime(d: Date, h24: boolean): { main: string; suffix: string } {
  const h = d.getHours();
  const m = pad(d.getMinutes());
  if (h24) return { main: `${pad(h)}:${m}`, suffix: '' };
  return { main: `${pad(h % 12 === 0 ? 12 : h % 12)}:${m}`, suffix: h >= 12 ? 'PM' : 'AM' };
}
export function fmtHHMM(hhmm: string, h24: boolean) {
  const [h, m] = hhmm.split(':').map(Number);
  const t = fmtTime(new Date(2000, 0, 1, h, m), h24);
  return `${t.main}${t.suffix ? ' ' + t.suffix : ''}`;
}
export const fmtDate = (d: Date) => `${d.getDate()} ${MON_SHORT[d.getMonth()]} ${d.getFullYear()}`;
export const fmtShort = (d: Date) => `${DOW[d.getDay()]} ${d.getDate()} ${MON_SHORT[d.getMonth()]}`;

export function dayLabel(d: Date, now = new Date()): { rel: string; rest: string } {
  const diff = dayDiff(now, d);
  const rest = fmtShort(d) + (d.getFullYear() !== now.getFullYear() ? ` ${d.getFullYear()}` : '');
  if (diff === 0) return { rel: 'Today', rest };
  if (diff === 1) return { rel: 'Tomorrow', rest };
  if (diff === -1) return { rel: 'Yesterday', rest };
  return { rel: '', rest };
}

/* ---------- Reminder recurrence ---------- */

export const effectiveDue = (r: Reminder) => r.snoozedUntil ?? r.at;

function withTimeOf(day: Date, base: Date) {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), base.getHours(), base.getMinutes());
}

export function occursOnDay(r: Reminder, dayIn: Date): boolean {
  const day = startOfDay(dayIn);
  const anchor = new Date(r.at);
  const anchorDay = startOfDay(anchor);
  const diff = dayDiff(anchorDay, day);
  if (diff < 0) return false;
  const rep = r.repeat;
  const domOk = () => day.getDate() === Math.min(anchor.getDate(), daysInMonth(day.getFullYear(), day.getMonth()));
  const monthDiff = (day.getFullYear() - anchor.getFullYear()) * 12 + (day.getMonth() - anchor.getMonth());
  const yearDiff = day.getFullYear() - anchor.getFullYear();
  const n = Math.max(1, rep.interval);
  switch (rep.type) {
    case 'none':
      return diff === 0;
    case 'day':
      return true;
    case 'week':
      return diff % 7 === 0;
    case 'month':
      return domOk();
    case 'year':
      return day.getMonth() === anchor.getMonth() && domOk();
    case 'weekdays':
      return rep.weekdays.includes(day.getDay());
    case 'custom':
      switch (rep.unit) {
        case 'minute':
        case 'hour':
          return true;
        case 'day':
          return diff % n === 0;
        case 'week':
          return diff % (7 * n) === 0;
        case 'month':
          return monthDiff % n === 0 && domOk();
        case 'year':
          return yearDiff % n === 0 && day.getMonth() === anchor.getMonth() && domOk();
      }
  }
  return false;
}

/** First occurrence strictly after `after`, or null. */
export function nextOccurrence(r: Reminder, after: number): number | null {
  const rep = r.repeat;
  if (r.at > after) return r.at;
  if (rep.type === 'none') return null;
  if (rep.type === 'custom' && (rep.unit === 'minute' || rep.unit === 'hour')) {
    const step = Math.max(1, rep.interval) * (rep.unit === 'minute' ? 60000 : 3600000);
    const k = Math.floor((after - r.at) / step) + 1;
    return r.at + k * step;
  }
  const base = new Date(r.at);
  const from = startOfDay(new Date(after));
  for (let i = 0; i <= 3700; i++) {
    const day = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    if (occursOnDay(r, day)) {
      const t = withTimeOf(day, base).getTime();
      if (t > after) return t;
    }
  }
  return null;
}

export function repeatLabel(r: Reminder['repeat']): string {
  switch (r.type) {
    case 'none':
      return 'No repeat';
    case 'day':
      return 'Every day';
    case 'week':
      return 'Every week';
    case 'month':
      return 'Every month';
    case 'year':
      return 'Every year';
    case 'weekdays':
      return r.weekdays.length ? 'Every ' + [...r.weekdays].sort((a, b) => a - b).map((d) => DOW[d]).join(', ') : 'Selected weekdays';
    case 'custom':
      return `Every ${r.interval} ${r.unit}${r.interval > 1 ? 's' : ''}`;
  }
}

export function advanceLabel(min: number): string {
  if (!min) return 'None';
  if (min % 1440 === 0) return `${min / 1440} day${min / 1440 > 1 ? 's' : ''} before`;
  if (min % 60 === 0) return `${min / 60} hour${min / 60 > 1 ? 's' : ''} before`;
  return `${min} minutes before`;
}

/* ---------- Birthdays ---------- */

export function parseDob(dob: string) {
  const [y, m, d] = dob.split('-').map(Number);
  return { y, m: m - 1, d };
}

export function birthdayAt(b: Birthday, year: number): Date {
  const { m, d } = parseDob(b.dob);
  const [hh, mm] = b.time.split(':').map(Number);
  const day = Math.min(d, daysInMonth(year, m));
  return new Date(year, m, day, hh, mm);
}

export function nextBirthday(b: Birthday, now = new Date()): Date {
  let t = birthdayAt(b, now.getFullYear());
  if (startOfDay(t) < startOfDay(now)) t = birthdayAt(b, now.getFullYear() + 1);
  return t;
}

export function birthdayOnDay(b: Birthday, day: Date): boolean {
  const { y, m, d } = parseDob(b.dob);
  if (day.getFullYear() < y) return false;
  return day.getMonth() === m && day.getDate() === Math.min(d, daysInMonth(day.getFullYear(), m));
}

export function turningAge(b: Birthday, on: Date) {
  return on.getFullYear() - parseDob(b.dob).y;
}
