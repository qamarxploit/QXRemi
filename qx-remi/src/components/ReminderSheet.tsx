import { useMemo, useRef, useState } from 'react';
import { COLORS, COLOR_KEYS, NO_REPEAT, type ColorKey, type Reminder, type Repeat, type RepeatUnit } from '../lib/types';
import { addDays, advanceLabel, DOW, dayDiff, fmtDate, fmtShort, nextOccurrence, pad, repeatLabel, startOfDay } from '../lib/dates';
import { uid, useStore } from '../lib/store';
import {
  CalendarIcon,
  CheckIcon,
  ContactIcon,
  Dialog,
  GearIcon,
  HistoryIcon,
  PhoneIcon,
  RepeatIcon,
  TextBtn,
  Toggle,
  Wheel,
  ChoiceDialog,
  TrashIcon,
  SnoozeIcon,
} from './ui';

type Sub = null | 'repeat' | 'advance' | 'settings' | 'contact' | 'snooze';

interface ContactPicker {
  contacts?: { select: (props: string[], opts?: { multiple?: boolean }) => Promise<{ name?: string[]; tel?: string[] }[]> };
}

export default function ReminderSheet({ initial, presetDate, onClose }: { initial?: Reminder; presetDate?: Date; onClose: () => void }) {
  const { settings, saveReminder, toast, requestComplete, requestDelete, snoozeReminder } = useStore();
  const editing = !!initial;
  const now = useMemo(() => new Date(), []);

  const init = useMemo(() => {
    const today = startOfDay(now);
    let at: Date;
    if (initial) at = new Date(initial.at);
    else {
      at = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0);
      if (presetDate) at = new Date(presetDate.getFullYear(), presetDate.getMonth(), presetDate.getDate(), at.getHours(), 0);
      else if (settings.addTomorrow) at = addDays(at, 1);
      if (at.getTime() <= now.getTime() + 60000 && !presetDate && !settings.addTomorrow) at = addDays(at, 0);
    }
    const diff = dayDiff(today, at);
    const sel: 'today' | 'tomorrow' | 'custom' = diff === 0 ? 'today' : diff === 1 ? 'tomorrow' : 'custom';
    return { at, sel };
  }, [initial, presetDate, now, settings.addTomorrow]);

  const [title, setTitle] = useState(initial?.title ?? '');
  const [sel, setSel] = useState(init.sel);
  const [custom, setCustom] = useState<Date | null>(init.sel === 'custom' ? startOfDay(init.at) : null);
  const [hour, setHour] = useState(init.at.getHours());
  const [minute, setMinute] = useState(init.at.getMinutes());
  const [color, setColor] = useState<ColorKey>(initial?.color ?? 'default');
  const [repeat, setRepeat] = useState<Repeat>(initial?.repeat ?? NO_REPEAT);
  const [contact, setContact] = useState(initial?.contact ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [showPhone, setShowPhone] = useState(!!initial?.phone);
  const [advance, setAdvance] = useState(initial?.advance ?? 0);
  const [sound, setSound] = useState(initial?.sound ?? true);
  const [vibrate, setVibrate] = useState(initial?.vibrate ?? true);
  const [sub, setSub] = useState<Sub>(null);
  const dateInput = useRef<HTMLInputElement>(null);
  const [shake, setShake] = useState(false);

  const step = Math.max(1, settings.minInterval);
  const minutes = useMemo(() => {
    const arr: number[] = [];
    for (let m = 0; m < 60; m += step) arr.push(m);
    return arr;
  }, [step]);
  const minIdx = Math.min(minutes.length - 1, Math.round(minute / step));

  const dateItems = ['Today', 'Tomorrow', ...(custom ? [fmtShort(custom)] : [])];
  const dateIdx = sel === 'today' ? 0 : sel === 'tomorrow' ? 1 : 2;
  const h24 = settings.hour24;
  const hourItems = h24 ? Array.from({ length: 24 }, (_, i) => pad(i)) : Array.from({ length: 12 }, (_, i) => pad(i + 1));
  const hourIdx = h24 ? hour : (hour % 12 || 12) - 1;
  const pm = hour >= 12;

  const chosenDay = (): Date => {
    const today = startOfDay(new Date());
    return sel === 'today' ? today : sel === 'tomorrow' ? addDays(today, 1) : custom ?? today;
  };

  const pickContact = async () => {
    const nav = navigator as unknown as ContactPicker;
    if (nav.contacts?.select) {
      try {
        const res = await nav.contacts.select(['name', 'tel'], { multiple: false });
        if (res[0]) {
          setContact(res[0].name?.[0] ?? '');
          if (res[0].tel?.[0]) {
            setPhone(res[0].tel[0]);
            setShowPhone(true);
          }
        }
        return;
      } catch {
        /* cancelled or denied -> fall through to manual entry */
      }
    }
    setSub('contact');
  };

  const save = () => {
    if (!title.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      toast('Please enter reminder text');
      return;
    }
    if (repeat.type === 'weekdays' && repeat.weekdays.length === 0) {
      toast('Select at least one weekday for the repeat');
      return;
    }
    const day = chosenDay();
    let at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute).getTime();
    const nowMs = Date.now();
    const base: Reminder = {
      id: initial?.id ?? uid(),
      title: title.trim(),
      at,
      color,
      repeat,
      contact,
      phone: phone.trim(),
      advance,
      sound,
      vibrate,
      completed: false,
      createdAt: initial?.createdAt ?? nowMs,
    };
    if (repeat.type === 'weekdays') {
      for (let i = 0; i < 8; i++) {
        const d = addDays(day, i);
        const t = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, minute).getTime();
        if (repeat.weekdays.includes(d.getDay()) && (t > nowMs || (editing && i === 0 && sel === 'custom'))) {
          at = t;
          break;
        }
      }
      base.at = at;
    }
    if (base.at <= nowMs) {
      if (repeat.type === 'none') {
        if (sel === 'today') {
          base.at += 86400000;
          toast('That time has passed — set for tomorrow');
        } else {
          toast('Choose a time in the future');
          return;
        }
      } else {
        base.at = nextOccurrence(base, nowMs) ?? base.at;
      }
    }
    saveReminder(base);
    onClose();
  };

  const rowCls = 'w-full flex items-center gap-3.5 px-4 py-3 text-left hover:bg-black/[0.02] active:bg-black/[0.06] transition-colors';

  return (
    <div className="absolute inset-0 z-40 bg-black/55 backdrop-blur-[2px] flex items-end anim-fade" onClick={onClose}>
      <div className="w-full bg-surface text-main rounded-t-3xl max-h-[95%] overflow-y-auto noscroll shadow-2xl border-t border-line/60 anim-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-line mx-auto mt-2.5" />

        <div className={`px-4 py-2.5 flex items-center gap-2 ${shake ? 'animate-pulse' : ''}`}>
          <input
            autoFocus={!editing}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            placeholder="Reminder text"
            aria-label="Reminder text"
            maxLength={200}
            className="flex-1 bg-transparent outline-none font-display text-lg font-semibold placeholder:text-sub caret-red-600 py-1"
          />
          {editing && (
            <button
              aria-label="Delete reminder"
              className="w-9 h-9 grid place-items-center text-sub hover:text-red-600 rounded-full active:scale-90 transition-all"
              onClick={async () => {
                await requestDelete(initial!.id);
                onClose();
              }}
            >
              <TrashIcon size={19} />
            </button>
          )}
        </div>

        {/* Date + time wheels */}
        <div className="relative bg-app border-y border-line/60">
          <div className="absolute left-0 right-0 bg-band pointer-events-none" style={{ top: 46, height: 46 }} />
          <div className="relative grid" style={{ gridTemplateColumns: h24 ? '1fr 78px 78px' : '1fr 68px 68px 68px' }}>
            <Wheel
              items={dateItems}
              index={dateIdx}
              align="left"
              onChange={(i) => {
                setSel(i === 0 ? 'today' : i === 1 ? 'tomorrow' : 'custom');
              }}
            />
            <Wheel
              items={hourItems}
              index={hourIdx}
              onChange={(i) => setHour(h24 ? i : ((i + 1) % 12) + (pm ? 12 : 0))}
            />
            <Wheel items={minutes.map(pad)} index={minIdx} onChange={(i) => setMinute(minutes[i])} />
            {!h24 && <Wheel items={['AM', 'PM']} index={pm ? 1 : 0} onChange={(i) => setHour((hour % 12) + (i ? 12 : 0))} />}
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-line">
          <div className="relative flex items-center gap-1">
            <button
              aria-label="Pick a date"
              className="w-9 h-9 grid place-items-center text-sub hover:text-main rounded-full active:scale-90 transition-all"
              onClick={() => (dateInput.current?.showPicker ? dateInput.current.showPicker() : dateInput.current?.click())}
            >
              <CalendarIcon size={20} />
            </button>
            <span className="text-xs font-display font-semibold text-sub">{fmtShort(chosenDay())}</span>
            <input
              ref={dateInput}
              type="date"
              tabIndex={-1}
              aria-hidden
              className="absolute left-0 top-8 w-0 h-0 opacity-0"
              value={`${chosenDay().getFullYear()}-${pad(chosenDay().getMonth() + 1)}-${pad(chosenDay().getDate())}`}
              onChange={(e) => {
                if (!e.target.value) return;
                const [y, m, d] = e.target.value.split('-').map(Number);
                const nd = new Date(y, m - 1, d);
                const diff = dayDiff(startOfDay(new Date()), nd);
                if (diff === 0) setSel('today');
                else if (diff === 1) setSel('tomorrow');
                else {
                  setCustom(nd);
                  setSel('custom');
                }
              }}
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              aria-label="Reminder settings"
              className="w-9 h-9 grid place-items-center text-sub hover:text-main rounded-full active:scale-90 transition-all"
              onClick={() => setSub('settings')}
            >
              <GearIcon size={20} />
            </button>
            <button
              aria-label="Save reminder"
              className="w-9 h-9 grid place-items-center rounded-full bg-red-600 text-white shadow-sm active:scale-90 transition-all"
              onClick={save}
            >
              <CheckIcon size={20} />
            </button>
          </div>
        </div>

        {/* Colors */}
        <div className="flex gap-3 px-4 py-3 overflow-x-auto noscroll border-b border-line/60" role="radiogroup" aria-label="Color">
          {COLOR_KEYS.map((k) => {
            const active = color === k;
            return (
              <button
                key={k}
                role="radio"
                aria-checked={active}
                aria-label={k}
                onClick={() => setColor(k)}
                className={`w-9 h-9 rounded-full shrink-0 grid place-items-center transition-transform active:scale-90 ${
                  active ? 'scale-110 ring-2 ring-offset-2 ring-[var(--accent)]' : 'opacity-85 hover:opacity-100'
                }`}
                style={k === 'default' ? { border: '2px solid var(--sub)', color: 'var(--sub)' } : { background: COLORS[k], color: '#fff' }}
              >
                {active && <CheckIcon size={18} />}
              </button>
            );
          })}
        </div>

        <button className={rowCls} onClick={() => setSub('repeat')}>
          <span className="text-sub w-6 grid place-items-center"><RepeatIcon size={19} /></span>
          <span className="flex-1 min-w-0">
            <span className="block text-[0.95rem] font-medium">Add a repeat</span>
            {repeat.type !== 'none' && <span className="block text-xs font-semibold text-red-600">{repeatLabel(repeat)}</span>}
          </span>
        </button>

        <button className={rowCls} onClick={pickContact}>
          <span className="text-sub w-6 grid place-items-center"><ContactIcon size={19} /></span>
          <span className="flex-1 min-w-0">
            <span className="block text-[0.95rem] font-medium">Add a contact</span>
            {contact && <span className="block text-xs font-semibold text-red-600 truncate">{contact}</span>}
          </span>
          {contact && (
            <span
              role="button"
              aria-label="Remove contact"
              className="text-sub hover:text-main px-2 py-1 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                setContact('');
              }}
            >
              ✕
            </span>
          )}
        </button>

        <button className={rowCls} onClick={() => setShowPhone((v) => !v)}>
          <span className="text-sub w-6 grid place-items-center"><PhoneIcon size={19} /></span>
          <span className="flex-1 text-[0.95rem] font-medium">Add a phone number</span>
        </button>
        {showPhone && (
          <div className="px-4 pb-2.5 pl-13">
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              aria-label="Phone number"
              className="w-full border-b-2 border-line bg-transparent py-1.5 outline-none focus:border-red-600 text-sm"
            />
          </div>
        )}

        <button className={rowCls} onClick={() => setSub('advance')}>
          <span className="text-sub w-6 grid place-items-center"><HistoryIcon size={19} /></span>
          <span className="flex-1 min-w-0">
            <span className="block text-[0.95rem] font-medium">Advance reminder</span>
            {advance > 0 && <span className="block text-xs font-semibold text-red-600">{advanceLabel(advance)}</span>}
          </span>
        </button>

        {editing && initial && (
          <div className="flex gap-2 px-4 pt-2 pb-1">
            <button
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display text-sm font-bold shadow-xs active:scale-[0.98] transition-all"
              onClick={async () => {
                await requestComplete(initial.id);
                onClose();
              }}
            >
              Complete
            </button>
            <button
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-display text-sm font-bold shadow-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
              onClick={() => setSub('snooze')}
            >
              <SnoozeIcon size={17} /> Snooze
            </button>
          </div>
        )}
        <div className="h-4" />
      </div>

      {sub === 'repeat' && <RepeatDialog value={repeat} baseDow={chosenDay().getDay()} onClose={() => setSub(null)} onSave={(r) => { setRepeat(r); setSub(null); }} />}
      {sub === 'advance' && <AdvanceDialog value={advance} onClose={() => setSub(null)} onSave={(v) => { setAdvance(v); setSub(null); }} />}
      {sub === 'settings' && (
        <Dialog title="Reminder settings" onClose={() => setSub(null)} actions={<TextBtn onClick={() => setSub(null)}>Done</TextBtn>}>
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-sm font-medium">Play sound</span>
            <Toggle on={sound} onChange={setSound} label="Play sound" />
          </div>
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-sm font-medium">Vibrate</span>
            <Toggle on={vibrate} onChange={setVibrate} label="Vibrate" />
          </div>
          <p className="px-3 pb-2 text-xs text-sub leading-relaxed">
            These apply only to this reminder. Global sound, volume and ringtone are in Settings → Notifications.
          </p>
        </Dialog>
      )}
      {sub === 'contact' && <ContactDialog value={contact} onClose={() => setSub(null)} onSave={(v) => { setContact(v); setSub(null); }} />}
      {sub === 'snooze' && initial && (
        <ChoiceDialog
          title="Snooze for"
          options={settings.snoozes.map((m) => ({ value: m, label: m >= 60 && m % 60 === 0 ? `${m / 60} hour${m > 60 ? 's' : ''}` : `${m} minutes` }))}
          onPick={(m) => {
            snoozeReminder(initial.id, m);
            toast(`Snoozed for ${m} min`);
            onClose();
          }}
          onClose={() => setSub(null)}
        />
      )}
      <span className="sr-only">{fmtDate(chosenDay())}</span>
    </div>
  );
}

function ContactDialog({ value, onClose, onSave }: { value: string; onClose: () => void; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  return (
    <Dialog
      title="Add a contact"
      onClose={onClose}
      actions={
        <>
          <TextBtn color="var(--sub)" onClick={onClose}>Cancel</TextBtn>
          <TextBtn onClick={() => onSave(v.trim())}>OK</TextBtn>
        </>
      }
    >
      <div className="px-3 pb-2">
        <input
          autoFocus
          value={v}
          onChange={(e) => setV(e.target.value)}
          placeholder="Contact name"
          className="w-full border-b-2 border-line bg-transparent py-2 text-sm outline-none focus:border-red-600"
        />
        <p className="text-xs text-sub mt-3 leading-relaxed">
          Your browser has no contact picker, so type the name. On a supported phone browser, the system contact picker opens instead.
        </p>
      </div>
    </Dialog>
  );
}

function RepeatDialog({ value, baseDow, onClose, onSave }: { value: Repeat; baseDow: number; onClose: () => void; onSave: (r: Repeat) => void }) {
  const [type, setType] = useState(value.type);
  const [days, setDays] = useState<number[]>(value.weekdays.length ? value.weekdays : [baseDow]);
  const [interval, setInterval_] = useState(value.interval || 1);
  const [unit, setUnit] = useState<RepeatUnit>(value.unit || 'day');
  const opts: { v: Repeat['type']; l: string }[] = [
    { v: 'none', l: 'No repeat' },
    { v: 'day', l: 'Every day' },
    { v: 'week', l: 'Every week' },
    { v: 'month', l: 'Every month' },
    { v: 'year', l: 'Every year' },
    { v: 'weekdays', l: 'Selected weekdays' },
    { v: 'custom', l: 'Custom interval' },
  ];
  return (
    <Dialog
      title="Repeat"
      onClose={onClose}
      actions={
        <>
          <TextBtn color="var(--sub)" onClick={onClose}>Cancel</TextBtn>
          <TextBtn onClick={() => onSave({ type, weekdays: type === 'weekdays' ? days : [], interval: type === 'custom' ? Math.max(1, interval) : 1, unit: type === 'custom' ? unit : 'day' })}>
            OK
          </TextBtn>
        </>
      }
    >
      {opts.map((o) => (
        <div key={o.v}>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/[0.03] active:bg-black/[0.06] text-left text-sm" onClick={() => setType(o.v)}>
            <span className="w-4 h-4 rounded-full border-2 grid place-items-center" style={{ borderColor: type === o.v ? '#dc2626' : 'var(--sub)' }}>
              {type === o.v && <span className="w-2 h-2 rounded-full bg-red-600" />}
            </span>
            {o.l}
          </button>
          {o.v === 'weekdays' && type === 'weekdays' && (
            <div className="flex flex-wrap gap-1.5 px-3 pb-2 pl-10">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <button
                  key={d}
                  aria-pressed={days.includes(d)}
                  onClick={() => setDays((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d]))}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                    days.includes(d) ? 'bg-red-600 text-white border-red-600' : 'border-line text-sub'
                  }`}
                >
                  {DOW[d]}
                </button>
              ))}
            </div>
          )}
          {o.v === 'custom' && type === 'custom' && (
            <div className="flex items-center gap-2 px-3 pb-2 pl-10 text-xs">
              <span className="text-sub">Every</span>
              <input
                type="number"
                min={1}
                max={999}
                value={interval}
                onChange={(e) => setInterval_(Math.max(1, Math.min(999, Number(e.target.value) || 1)))}
                aria-label="Interval"
                className="w-14 border-b-2 border-line bg-transparent py-1 text-center outline-none focus:border-red-600"
              />
              <select value={unit} onChange={(e) => setUnit(e.target.value as RepeatUnit)} aria-label="Unit" className="bg-transparent border-b-2 border-line py-1 outline-none">
                {(['minute', 'hour', 'day', 'week', 'month', 'year'] as RepeatUnit[]).map((u) => (
                  <option key={u} value={u} className="text-black">
                    {u}(s)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      ))}
    </Dialog>
  );
}

function AdvanceDialog({ value, onClose, onSave }: { value: number; onClose: () => void; onSave: (v: number) => void }) {
  const presets = [0, 5, 15, 30, 60, 1440, 4320];
  const isCustom = !presets.includes(value);
  const [sel, setSel] = useState<number | 'custom'>(isCustom ? 'custom' : value);
  const [amount, setAmount] = useState(isCustom ? (value % 1440 === 0 ? value / 1440 : value % 60 === 0 ? value / 60 : value) : 2);
  const [unit, setUnit] = useState<'minutes' | 'hours' | 'days'>(isCustom ? (value % 1440 === 0 ? 'days' : value % 60 === 0 ? 'hours' : 'minutes') : 'hours');
  const mult = unit === 'minutes' ? 1 : unit === 'hours' ? 60 : 1440;

  return (
    <Dialog
      title="Advance reminder"
      onClose={onClose}
      actions={
        <>
          <TextBtn color="var(--sub)" onClick={onClose}>Cancel</TextBtn>
          <TextBtn onClick={() => onSave(sel === 'custom' ? Math.max(1, amount * mult) : sel)}>OK</TextBtn>
        </>
      }
    >
      {presets.map((m) => (
        <button
          key={m}
          onClick={() => setSel(m)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/[0.03] active:bg-black/[0.06] text-left text-sm"
        >
          <span className="w-4 h-4 rounded-full border-2 grid place-items-center" style={{ borderColor: sel === m ? '#dc2626' : 'var(--sub)' }}>
            {sel === m && <span className="w-2 h-2 rounded-full bg-red-600" />}
          </span>
          {advanceLabel(m)}
        </button>
      ))}
      <button
        onClick={() => setSel('custom')}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-black/[0.03] active:bg-black/[0.06] text-left text-sm"
      >
        <span className="w-4 h-4 rounded-full border-2 grid place-items-center" style={{ borderColor: sel === 'custom' ? '#dc2626' : 'var(--sub)' }}>
          {sel === 'custom' && <span className="w-2 h-2 rounded-full bg-red-600" />}
        </span>
        Custom
      </button>
      {sel === 'custom' && (
        <div className="flex items-center gap-2 px-3 pb-2 pl-10 text-xs">
          <input
            type="number"
            min={1}
            max={9999}
            value={amount}
            onChange={(e) => setAmount(Math.max(1, Number(e.target.value) || 1))}
            className="w-16 border-b-2 border-line bg-transparent py-1 text-center outline-none focus:border-red-600"
          />
          <select value={unit} onChange={(e) => setUnit(e.target.value as 'minutes' | 'hours' | 'days')} className="bg-transparent border-b-2 border-line py-1 outline-none">
            <option value="minutes" className="text-black">minutes</option>
            <option value="hours" className="text-black">hours</option>
            <option value="days" className="text-black">days</option>
          </select>
        </div>
      )}
    </Dialog>
  );
}
