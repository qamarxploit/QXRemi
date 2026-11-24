import { useMemo, useState } from 'react';
import { COLORS, COLOR_KEYS, type Birthday, type ColorKey } from '../lib/types';
import { dayDiff, fmtDate, fmtHHMM, fmtShort, nextBirthday, startOfDay, turningAge } from '../lib/dates';
import { uid, useStore } from '../lib/store';
import {
  CakeIcon,
  CaretDown,
  CheckIcon,
  ClipboardIcon,
  CloseIcon,
  ContactIcon,
  IconBtn,
  PaletteIcon,
  SearchIcon,
  TopBar,
  TrashIcon,
} from '../components/ui';
import AppMenu from '../components/AppMenu';
import type { Page } from '../App';

export function birthdaySummary(b: Birthday, now = new Date()) {
  const next = nextBirthday(b, now);
  const days = dayDiff(startOfDay(now), next);
  const age = turningAge(b, next);
  const when = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`;
  return { next, days, age, when };
}

export default function Birthdays({ onEdit, go }: { onEdit: (b: Birthday) => void; go: (p: Page) => void }) {
  const { birthdays, settings } = useStore();
  const [searching, setSearching] = useState(false);
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return birthdays
      .filter((b) => !term || b.name.toLowerCase().includes(term) || b.comment.toLowerCase().includes(term))
      .map((b) => ({ b, s: birthdaySummary(b) }))
      .sort((a, c) => a.s.days - c.s.days);
  }, [birthdays, q]);

  return (
    <div className="flex flex-col h-full anim-fade">
      {searching ? (
        <div className="bg-app h-12 flex items-center px-3 gap-2 shrink-0 anim-fade">
          <SearchIcon size={20} className="text-sub" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search birthdays"
            aria-label="Search birthdays"
            className="flex-1 bg-transparent outline-none text-sm text-main"
          />
          <IconBtn label="Close search" onClick={() => { setSearching(false); setQ(''); }}>
            <CloseIcon size={20} />
          </IconBtn>
        </div>
      ) : (
        <TopBar
          title="Birthdays"
          right={
            <>
              <IconBtn label="Search" onClick={() => setSearching(true)}>
                <SearchIcon size={20} />
              </IconBtn>
              <AppMenu go={go} />
            </>
          }
        />
      )}

      <div className="flex-1 overflow-y-auto pb-4">
        {list.length === 0 ? (
          <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-sub gap-2.5 anim-fade">
            <ClipboardIcon size={72} className="opacity-40" />
            <p className="text-base font-display font-medium">{q ? 'No matching birthdays' : 'No birthdays'}</p>
            {!q && <p className="text-xs">Tap the + button to add a birthday</p>}
          </div>
        ) : (
          <div className="bg-surface border-y border-line divide-y divide-[var(--line)]">
            {list.map(({ b, s }) => {
              const isSoon = s.days <= 7;
              const isToday = s.days === 0;
              return (
                <button
                  key={b.id}
                  onClick={() => onEdit(b)}
                  className="w-full flex items-center min-h-[64px] pr-3.5 text-left hover:bg-black/[0.02] active:bg-black/[0.06] transition-colors anim-item"
                >
                  <span className="w-[4px] h-10 rounded-r shrink-0" style={{ background: COLORS[b.color] }} />
                  <span
                    className="ml-3.5 w-9 h-9 rounded-xl grid place-items-center text-white shrink-0 shadow-xs"
                    style={{ background: COLORS[b.color] }}
                  >
                    <CakeIcon size={18} />
                  </span>
                  <span className="flex-1 min-w-0 pl-3 py-2">
                    <span className="block text-[0.98rem] font-display font-bold text-main truncate">{b.name}</span>
                    <span className="block text-xs text-sub truncate mt-0.5">
                      {fmtShort(s.next)} · {s.age > 0 ? `turns ${s.age}` : 'born this year'} · {fmtHHMM(b.time, settings.hour24)}
                    </span>
                    {b.comment && <span className="block text-[0.7rem] text-sub truncate mt-0.5">{b.comment}</span>}
                  </span>
                  <span
                    className={`text-[0.7rem] font-display font-bold px-2.5 py-1 rounded-full shrink-0 ${
                      isToday
                        ? 'bg-red-600 text-white anim-ring'
                        : isSoon
                          ? 'bg-red-500/10 text-red-600'
                          : 'bg-band text-sub'
                    }`}
                  >
                    {s.when}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const ADV = [0, 1, 2, 3, 5, 7, 14, 30];

export function BirthdayForm({ initial, onClose }: { initial?: Birthday; onClose: () => void }) {
  const { settings, saveBirthday, requestDeleteBirthday, toast } = useStore();
  const todayStr = fmtISO(new Date());
  const [name, setName] = useState(initial?.name ?? '');
  const [comment, setComment] = useState(initial?.comment ?? '');
  const [dob, setDob] = useState(initial?.dob ?? todayStr);
  const [time, setTime] = useState(initial?.time ?? settings.birthdayTime);
  const [adv, setAdv] = useState(initial?.advanceDays ?? settings.birthdayAdvance);
  const [color, setColor] = useState<ColorKey>(initial?.color ?? 'blue');
  const [palette, setPalette] = useState(false);

  const pickContact = async () => {
    const nav = navigator as unknown as { contacts?: { select: (p: string[], o?: { multiple: boolean }) => Promise<{ name?: string[] }[]> } };
    if (!nav.contacts?.select) {
      toast('Contact picker is not supported by this browser — type the name');
      return;
    }
    try {
      const res = await nav.contacts.select(['name'], { multiple: false });
      if (res[0]?.name?.[0]) setName(res[0].name[0]);
    } catch {
      /* cancelled */
    }
  };

  const done = () => {
    if (!name.trim()) return toast('Please enter a name');
    if (!dob || dob > todayStr) return toast('Date of birth cannot be in the future');
    saveBirthday({
      id: initial?.id ?? uid(),
      name: name.trim(),
      comment: comment.trim(),
      dob,
      time,
      advanceDays: adv,
      color,
      fired: initial && initial.dob === dob && initial.time === time && initial.advanceDays === adv ? initial.fired : [],
      createdAt: initial?.createdAt ?? Date.now(),
    });
    onClose();
  };

  const field =
    'w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm text-main outline-none focus:border-blue-600 transition-colors';
  const label = 'absolute -top-2 left-2.5 px-1 bg-app text-[0.7rem] font-semibold text-sub';

  return (
    <div className="flex flex-col h-full anim-fade">
      <TopBar
        title={initial ? 'Edit birthday' : 'Birthday'}
        onBack={onClose}
        right={
          <>
            {initial && (
              <IconBtn
                label="Delete birthday"
                onClick={async () => {
                  await requestDeleteBirthday(initial.id);
                  onClose();
                }}
              >
                <TrashIcon size={19} />
              </IconBtn>
            )}
            <div className="relative">
              <IconBtn label="Color" onClick={() => setPalette((v) => !v)}>
                <PaletteIcon size={19} />
              </IconBtn>
              {palette && (
                <div className="absolute right-0 top-10 z-20 bg-surface rounded-2xl shadow-xl border border-line p-2.5 grid grid-cols-3 gap-2.5 anim-pop">
                  {COLOR_KEYS.map((k) => (
                    <button
                      key={k}
                      aria-label={k}
                      onClick={() => {
                        setColor(k);
                        setPalette(false);
                      }}
                      className="w-8 h-8 rounded-full grid place-items-center text-white active:scale-90 transition-transform"
                      style={{ background: COLORS[k] }}
                    >
                      {color === k && <CheckIcon size={16} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 border-t border-line">
        <div className="relative mt-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            aria-label="Name"
            maxLength={80}
            className={field + ' pr-10'}
          />
          <button
            aria-label="Pick from contacts"
            onClick={pickContact}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sub hover:text-main transition-colors"
          >
            <ContactIcon size={18} />
          </button>
        </div>

        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Comment (optional)"
          aria-label="Comment"
          maxLength={200}
          className={field}
        />

        <div className="relative">
          <span className={label}>Date of birth</span>
          <input
            type="date"
            value={dob}
            max={todayStr}
            onChange={(e) => setDob(e.target.value)}
            aria-label="Date of birth"
            className={field + ' appearance-none'}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sub">
            <CaretDown size={18} />
          </span>
          <span className="sr-only">{dob && fmtDate(new Date(dob + 'T00:00'))}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className={label}>Reminder time</span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value || '10:00')}
              aria-label="Reminder time"
              className={field}
            />
          </div>
          <span className="text-sub text-base font-bold">+</span>
          <div className="relative flex-1">
            <span className={label}>Advance reminder</span>
            <select
              value={adv}
              onChange={(e) => setAdv(Number(e.target.value))}
              aria-label="Advance reminder"
              className={field + ' appearance-none'}
            >
              {(ADV.includes(adv) ? ADV : [...ADV, adv].sort((a, b) => a - b)).map((d) => (
                <option key={d} value={d} className="text-black">
                  {d === 0 ? 'None' : d === 1 ? '1 day' : `${d} days`}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sub">
              <CaretDown size={18} />
            </span>
          </div>
        </div>

        <button
          onClick={done}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-display text-base font-bold shadow-md active:scale-[0.98] transition-all"
        >
          Done
        </button>

        <p className="text-xs text-sub leading-relaxed">
          The reminder repeats every year automatically. Feb 29 birthdays are shown on Feb 28 in non-leap years.
        </p>
      </div>
    </div>
  );
}

function fmtISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
