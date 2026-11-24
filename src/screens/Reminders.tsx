import { useMemo, useState } from 'react';
import { COLORS, type Reminder } from '../lib/types';
import { dateKey, dayLabel, effectiveDue, fmtTime, repeatLabel, startOfDay, advanceLabel } from '../lib/dates';
import { useStore } from '../lib/store';
import { ChevronR, ClipboardIcon, CloseIcon, IconBtn, RepeatIcon, SearchIcon, SwipeRow, TopBar } from '../components/ui';
import AppMenu from '../components/AppMenu';
import type { Page } from '../App';

export function ReminderRow({ r, time, onTap, showRepeat = true }: { r: Reminder; time?: number; onTap?: () => void; showRepeat?: boolean }) {
  const { settings } = useStore();
  const due = time ?? effectiveDue(r);
  const t = fmtTime(new Date(due), settings.hour24);
  const overdue = !r.completed && r.repeat.type === 'none' && due < Date.now();
  const extra = [r.contact, r.phone, r.advance ? advanceLabel(r.advance) : '', r.snoozedUntil ? 'Snoozed' : ''].filter(Boolean).join(' · ');

  return (
    <div onClick={onTap} className="flex items-center min-h-[56px] pr-3.5 relative hover:bg-black/[0.02] active:bg-black/[0.05] transition-colors anim-item">
      <span className="w-[4px] self-center h-8 rounded-r shrink-0" style={{ background: COLORS[r.color] }} />
      <div className="pl-3 flex items-baseline shrink-0">
        <span className={`font-display text-[1.28rem] leading-none font-bold tracking-tight ${overdue ? 'text-red-600' : 'text-main'}`}>
          {t.main}
        </span>
        {t.suffix && <span className="text-[0.65rem] font-display font-bold uppercase ml-1 text-sub">{t.suffix}</span>}
      </div>
      <div className="flex-1 min-w-0 pl-3 py-2">
        <div className={`text-[0.95rem] font-medium truncate ${r.completed ? 'line-through text-sub' : 'text-main'}`}>{r.title}</div>
        {extra && <div className="text-[0.7rem] text-sub truncate mt-0.5">{extra}</div>}
      </div>
      {showRepeat && r.repeat.type !== 'none' && (
        <span className="text-sub ml-2 shrink-0" title={repeatLabel(r.repeat)} aria-label={repeatLabel(r.repeat)}>
          <RepeatIcon size={16} />
        </span>
      )}
    </div>
  );
}

export default function Reminders({ onEdit, go }: { onEdit: (r: Reminder) => void; go: (p: Page) => void }) {
  const { reminders, settings, requestComplete, snoozeReminder, toast } = useStore();
  const [searching, setSearching] = useState(false);
  const [q, setQ] = useState('');

  const completedCount = reminders.filter((r) => r.completed).length;
  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = reminders
      .filter((r) => !r.completed)
      .filter((r) => !term || [r.title, r.contact, r.phone].some((s) => s.toLowerCase().includes(term)))
      .sort((a, b) => effectiveDue(a) - effectiveDue(b));
    const today = startOfDay(new Date());
    const map = new Map<string, { label: { rel: string; rest: string }; items: Reminder[] }>();
    for (const r of list) {
      const d = new Date(effectiveDue(r));
      const overdue = startOfDay(d) < today;
      const key = overdue ? 'overdue' : dateKey(d);
      if (!map.has(key)) map.set(key, { label: overdue ? { rel: 'Overdue', rest: '' } : dayLabel(d), items: [] });
      map.get(key)!.items.push(r);
    }
    return [...map.entries()];
  }, [reminders, q]);

  const snoozeMin = settings.snoozes[0] ?? 5;

  return (
    <div className="flex flex-col h-full anim-fade">
      {searching ? (
        <div className="bg-app h-12 flex items-center px-3 gap-2 shrink-0 border-b border-line/60 anim-fade">
          <SearchIcon size={19} className="text-sub" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reminders"
            aria-label="Search reminders"
            className="flex-1 bg-transparent outline-none text-sm text-main"
          />
          <IconBtn label="Close search" onClick={() => { setSearching(false); setQ(''); }}>
            <CloseIcon size={19} />
          </IconBtn>
        </div>
      ) : (
        <TopBar
          title="Reminders"
          right={
            <>
              <IconBtn label="Search" onClick={() => setSearching(true)}>
                <SearchIcon size={19} />
              </IconBtn>
              <AppMenu go={go} />
            </>
          }
        />
      )}

      <div className="flex-1 overflow-y-auto pb-4">
        {groups.length === 0 ? (
          <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-sub gap-2.5 anim-fade">
            <ClipboardIcon size={72} className="opacity-40" />
            <p className="text-base font-display font-medium">{q ? 'No matching reminders' : 'No reminders'}</p>
            {!q && <p className="text-xs">Tap the + button to add one</p>}
          </div>
        ) : (
          groups.map(([key, g]) => (
            <section key={key} className="mt-2.5 first:mt-0 border-y border-line bg-surface anim-item">
              <h2
                className={`px-3.5 py-1.5 text-[0.7rem] font-display uppercase tracking-wider border-b border-line ${
                  key === 'overdue' ? 'text-red-600 font-bold' : 'text-sub font-semibold'
                }`}
              >
                {g.label.rel}
                {g.label.rel && g.label.rest ? ' ' : ''}
                <span className="font-bold">{g.label.rest}</span>
              </h2>
              <div className="divide-y divide-[var(--line)]">
                {g.items.map((r) => (
                  <SwipeRow
                    key={r.id}
                    enabled={settings.swipe}
                    leftLabel={`Snooze ${snoozeMin}m`}
                    onRight={() => requestComplete(r.id)}
                    onLeft={() => {
                      snoozeReminder(r.id, snoozeMin);
                      toast(`Snoozed for ${snoozeMin} min`);
                    }}
                    onTap={() => onEdit(r)}
                  >
                    <ReminderRow r={r} />
                  </SwipeRow>
                ))}
              </div>
            </section>
          ))
        )}

        {completedCount > 0 && !q && (
          <button
            onClick={() => go('completed')}
            className="mt-2.5 w-full flex items-center px-4 py-3 bg-surface border-y border-line text-xs font-display font-semibold text-sub hover:bg-black/[0.02] active:bg-black/[0.05] transition-colors"
          >
            <span className="flex-1 text-left">Completed ({completedCount})</span>
            <ChevronR size={17} />
          </button>
        )}
      </div>
    </div>
  );
}
