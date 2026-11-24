import { useMemo } from 'react';
import { COLORS, type Birthday, type Reminder } from '../lib/types';
import { birthdayOnDay, dayDiff, dayLabel, DOW, MONTHS, occursOnDay, sameDay, startOfDay, turningAge, fmtHHMM, effectiveDue } from '../lib/dates';
import { useStore } from '../lib/store';
import { CakeIcon, ChevronL, ChevronR, IconBtn, TopBar } from '../components/ui';
import AppMenu from '../components/AppMenu';
import { ReminderRow } from './Reminders';
import type { Page } from '../App';

function isoWeek(d: Date) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dow = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dow);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - y0.getTime()) / 86400000 + 1) / 7);
}

export default function CalendarScreen({
  selected,
  setSelected,
  onEdit,
  onEditBirthday,
  onAdd,
  go,
}: {
  selected: Date;
  setSelected: (d: Date) => void;
  onEdit: (r: Reminder) => void;
  onEditBirthday: (b: Birthday) => void;
  onAdd: () => void;
  go: (p: Page) => void;
}) {
  const { reminders, birthdays, settings } = useStore();
  const viewY = selected.getFullYear();
  const viewM = selected.getMonth();
  const today = new Date();
  const first = settings.firstDay;

  const active = useMemo(() => reminders.filter((r) => !r.completed), [reminders]);

  const cells = useMemo(() => {
    const start = new Date(viewY, viewM, 1);
    const offset = (start.getDay() - first + 7) % 7;
    const dim = new Date(viewY, viewM + 1, 0).getDate();
    const total = Math.ceil((offset + dim) / 7) * 7;
    return Array.from({ length: total }, (_, i) => {
      const dayNum = i - offset + 1;
      if (dayNum < 1 || dayNum > dim) return null;
      const date = new Date(viewY, viewM, dayNum);
      const colors: string[] = [];
      for (const r of active) if (occursOnDay(r, date)) colors.push(COLORS[r.color]);
      for (const b of birthdays) if (birthdayOnDay(b, date)) colors.push(COLORS[b.color]);
      return { date, colors: [...new Set(colors)].slice(0, 3) };
    });
  }, [viewY, viewM, first, active, birthdays]);

  const weekdays = Array.from({ length: 7 }, (_, i) => (first + i) % 7);
  const move = (delta: number) => {
    const d = new Date(viewY, viewM + delta, 1);
    const dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    setSelected(new Date(d.getFullYear(), d.getMonth(), Math.min(selected.getDate(), dim)));
  };

  const dayReminders = active
    .filter((r) => occursOnDay(r, selected))
    .map((r) => {
      const at = new Date(r.at);
      const t = sameDay(at, selected) ? effectiveDue(r) : new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), at.getHours(), at.getMinutes()).getTime();
      return { r, t };
    })
    .sort((a, b) => a.t - b.t);
  const dayBirthdays = birthdays.filter((b) => birthdayOnDay(b, selected));
  const lbl = dayLabel(selected);
  const rows = Math.ceil(cells.length / 7);

  return (
    <div className="flex flex-col h-full anim-fade">
      <TopBar title="Calendar" right={<AppMenu go={go} />} />
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center px-2 pt-1.5">
          <IconBtn label="Previous month" onClick={() => move(-1)}>
            <ChevronL size={20} />
          </IconBtn>
          <button
            className="flex-1 text-center font-display text-lg font-bold text-main hover:text-red-600 transition-colors"
            onClick={() => setSelected(startOfDay(new Date()))}
            aria-label="Go to today"
          >
            {MONTHS[viewM]} {viewY}
          </button>
          <IconBtn label="Next month" onClick={() => move(1)}>
            <ChevronR size={20} />
          </IconBtn>
        </div>

        <div className="px-2 pb-2">
          <div className="grid mt-1.5" style={{ gridTemplateColumns: settings.weekNumber ? '1.4rem repeat(7, 1fr)' : 'repeat(7, 1fr)' }}>
            {settings.weekNumber && <span />}
            {weekdays.map((d) => (
              <span key={d} className="text-center font-display text-[0.7rem] font-bold uppercase text-emerald-600 py-1.5">
                {DOW[d]}
              </span>
            ))}
          </div>

          {Array.from({ length: rows }, (_, row) => {
            const rowCells = cells.slice(row * 7, row * 7 + 7);
            const firstReal = rowCells.find(Boolean);
            return (
              <div key={row} className="grid" style={{ gridTemplateColumns: settings.weekNumber ? '1.4rem repeat(7, 1fr)' : 'repeat(7, 1fr)' }}>
                {settings.weekNumber && (
                  <span className="text-[0.65rem] text-sub grid place-items-center">{firstReal ? isoWeek(firstReal.date) : ''}</span>
                )}
                {rowCells.map((c, i) => {
                  if (!c) return <span key={i} />;
                  const isToday = sameDay(c.date, today);
                  const isSel = sameDay(c.date, selected);
                  const weekend = c.date.getDay() === 0 || c.date.getDay() === 6;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelected(c.date)}
                      aria-label={c.date.toDateString()}
                      aria-pressed={isSel}
                      className="h-[3.1rem] flex flex-col items-center pt-0.5 active:scale-90 transition-transform"
                    >
                      <span
                        className={`w-8 h-8 grid place-items-center rounded-full font-display text-sm font-semibold transition-all ${
                          isToday ? 'bg-red-600 text-white shadow-xs' : weekend ? 'text-red-600' : 'text-main hover:bg-black/[0.04]'
                        }`}
                        style={
                          isSel && !isToday
                            ? { boxShadow: 'inset 0 0 0 2px #dc2626' }
                            : isSel
                              ? { boxShadow: '0 0 0 2px var(--bg), 0 0 0 3.5px #dc2626' }
                              : undefined
                        }
                      >
                        {c.date.getDate()}
                      </span>
                      <span className="flex gap-[3px] h-1.5 mt-0.5">
                        {c.colors.map((col, k) => (
                          <span key={k} className="w-1.5 h-1.5 rounded-full" style={{ background: col }} />
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        <section className="bg-surface border-y border-line anim-item">
          <div className="px-4 py-2.5 border-b border-line flex items-center">
            <h2 className="flex-1 font-display text-xs uppercase tracking-wider text-sub">
              {lbl.rel} <span className="font-bold text-main">{lbl.rest}</span>
              {dayDiff(startOfDay(today), selected) === 0 ? '' : ''}
            </h2>
            <button
              onClick={onAdd}
              className="text-red-600 hover:bg-red-500/10 font-display font-bold text-xs uppercase px-2.5 py-1 rounded-lg transition-colors"
            >
              + Add event
            </button>
          </div>
          {dayReminders.length === 0 && dayBirthdays.length === 0 ? (
            <p className="px-4 py-5 text-center text-xs text-sub">No events on this day</p>
          ) : (
            <div className="divide-y divide-[var(--line)]">
              {dayBirthdays.map((b) => (
                <button
                  key={b.id}
                  onClick={() => onEditBirthday(b)}
                  className="w-full flex items-center min-h-[56px] pr-4 text-left hover:bg-black/[0.02] active:bg-black/[0.05] transition-colors anim-item"
                >
                  <span className="w-[4px] h-8 rounded-r" style={{ background: COLORS[b.color] }} />
                  <span className="ml-3 font-display text-main font-bold text-sm w-[4.5rem]">{fmtHHMM(b.time, settings.hour24)}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-main truncate">🎂 {b.name}</span>
                    <span className="block text-[0.7rem] text-sub">
                      {turningAge(b, selected) > 0 ? `Turns ${turningAge(b, selected)}` : 'Birthday'}
                    </span>
                  </span>
                  <CakeIcon className="text-sub" size={18} />
                </button>
              ))}
              {dayReminders.map(({ r, t }) => (
                <ReminderRow key={r.id} r={r} time={t} onTap={() => onEdit(r)} />
              ))}
            </div>
          )}
        </section>
        <div className="h-4" />
      </div>
    </div>
  );
}
