import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { DEFAULT_SETTINGS, type Birthday, type Reminder, type Settings } from './types';
import { birthdayAt, effectiveDue, fmtHHMM, nextOccurrence, turningAge } from './dates';

export interface AlertItem {
  key: string;
  kind: 'reminder' | 'birthday';
  refId: string;
  title: string;
  body: string;
  at: number;
}

interface ConfirmState {
  message: string;
  okLabel: string;
  resolve: (v: boolean) => void;
}

interface Ctx {
  reminders: Reminder[];
  birthdays: Birthday[];
  settings: Settings;
  updateSettings: (p: Partial<Settings>) => void;
  saveReminder: (r: Reminder) => void;
  deleteReminder: (id: string) => void;
  completeReminder: (id: string) => void;
  restoreReminder: (id: string) => void;
  snoozeReminder: (id: string, minutes: number) => void;
  saveBirthday: (b: Birthday) => void;
  deleteBirthday: (id: string) => void;
  requestComplete: (id: string) => Promise<void>;
  requestDelete: (id: string) => Promise<void>;
  requestDeleteBirthday: (id: string) => Promise<void>;
  importData: (data: unknown) => { addedR: number; addedB: number; skipped: number };
  alerts: AlertItem[];
  openAlertByKey: (key: string) => void;
  dismissAlert: (key: string) => void;
  toastMsg: string;
  toast: (m: string) => void;
  confirmState: ConfirmState | null;
  ask: (message: string, okLabel?: string) => Promise<boolean>;
  answerConfirm: (v: boolean) => void;
  permission: NotificationPermission | 'unsupported';
  requestPermission: () => Promise<void>;
  playSound: (preview?: boolean) => void;
  stopSound: () => void;
  ringtoneUrl: string;
  setRingtone: (url: string, name: string) => boolean;
  lastBackup: number;
  setLastBackup: (t: number) => void;
}

const StoreCtx = createContext<Ctx>(null as unknown as Ctx);
export const useStore = () => useContext(StoreCtx);

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full */
  }
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const DEFAULT_RETRY_MINUTES = 5;
const DAYMS = 86400000;

function fmtTimeStr(t: number, h24: boolean) {
  const d = new Date(t);
  return fmtHHMM(`${d.getHours()}:${d.getMinutes()}`, h24);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [reminders, setReminders] = useState<Reminder[]>(() => load('qx.reminders', []));
  const [birthdays, setBirthdays] = useState<Birthday[]>(() => load('qx.birthdays', []));
  const [settings, setSettings] = useState<Settings>(() => ({ ...DEFAULT_SETTINGS, ...load('qx.settings', {}) }));
  const [queuedAlerts, setQueuedAlerts] = useState<AlertItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [toastMsg, setToastMsg] = useState('');
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [ringtoneUrl, setRingtoneUrl] = useState<string>(() => load('qx.ringtone', ''));
  const [lastBackup, setLastBackupState] = useState<number>(() => load('qx.lastBackup', 0));
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  );
  const [pendingRetries, setPendingRetries] = useState<Record<string, number>>(() => load('qx.pendingRetries', {}));

  const remRef = useRef(reminders);
  const bdRef = useRef(birthdays);
  const setRef = useRef(settings);
  const urlRef = useRef(ringtoneUrl);
  const retryRef = useRef(pendingRetries);
  const alertsRef = useRef(alerts);
  const queuedRef = useRef(queuedAlerts);

  remRef.current = reminders;
  bdRef.current = birthdays;
  setRef.current = settings;
  urlRef.current = ringtoneUrl;
  retryRef.current = pendingRetries;
  alertsRef.current = alerts;
  queuedRef.current = queuedAlerts;

  useEffect(() => save('qx.reminders', reminders), [reminders]);
  useEffect(() => save('qx.birthdays', birthdays), [birthdays]);
  useEffect(() => save('qx.settings', settings), [settings]);
  useEffect(() => save('qx.pendingRetries', pendingRetries), [pendingRetries]);

  const toastTimer = useRef<number>(0);
  const toast = useCallback((m: string) => {
    setToastMsg(m);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(''), 2600);
  }, []);

  const confirmRef = useRef<ConfirmState | null>(null);
  const ask = useCallback(
    (message: string, okLabel = 'OK') =>
      new Promise<boolean>((resolve) => {
        const st = { message, okLabel, resolve };
        confirmRef.current = st;
        setConfirmState(st);
      }),
    [],
  );

  const answerConfirm = useCallback((v: boolean) => {
    const st = confirmRef.current;
    confirmRef.current = null;
    setConfirmState(null);
    st?.resolve(v);
  }, []);

  /* ---------- sound ---------- */
  const audioCtx = useRef<AudioContext | null>(null);
  const audioEl = useRef<HTMLAudioElement | null>(null);

  const stopSound = useCallback(() => {
    if (audioEl.current) {
      audioEl.current.pause();
      audioEl.current = null;
    }
  }, []);

  const playSound = useCallback(
    (preview = false) => {
      const s = setRef.current;
      if (s.soundMode === 'silent' && !preview) return;
      const vol = Math.max(0, Math.min(1, s.volume / 100));
      stopSound();
      try {
        if (s.soundMode === 'custom' && urlRef.current) {
          const a = new Audio(urlRef.current);
          a.volume = vol;
          audioEl.current = a;
          void a.play();
          window.setTimeout(() => {
            if (audioEl.current === a) stopSound();
          }, 15000);
          return;
        }
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!audioCtx.current) audioCtx.current = new AC();
        const ctx = audioCtx.current;
        void ctx.resume();
        const t0 = ctx.currentTime;
        [0, 0.35, 0.7, 1.05].forEach((off, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.value = i % 2 ? 660 : 880;
          g.gain.setValueAtTime(0.0001, t0 + off);
          g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol * 0.5), t0 + off + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + off + 0.3);
          o.connect(g).connect(ctx.destination);
          o.start(t0 + off);
          o.stop(t0 + off + 0.32);
        });
      } catch {
        /* audio unavailable */
      }
    },
    [stopSound],
  );

  const setRingtone = useCallback((url: string, name: string) => {
    try {
      localStorage.setItem('qx.ringtone', JSON.stringify(url));
    } catch {
      return false;
    }
    setRingtoneUrl(url);
    setSettings((s) => ({ ...s, soundMode: 'custom', ringtoneName: name }));
    return true;
  }, []);

  /* ---------- notifications & popup on click ---------- */
  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    const p = await Notification.requestPermission();
    setPermission(p);
  }, []);

  const openAlertByKey = useCallback((key: string) => {
    const item = queuedRef.current.find((a) => a.key === key);
    if (!item) return;
    setAlerts((prev) => {
      const filtered = prev.filter((x) => !(x.kind === item.kind && x.refId === item.refId));
      return [...filtered, item];
    });
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const onMsg = (ev: MessageEvent) => {
      const data = ev.data as { type?: string; key?: string } | undefined;
      if (data?.type === 'OPEN_ALERT' && data.key) {
        openAlertByKey(data.key);
      }
    };
    navigator.serviceWorker.addEventListener('message', onMsg);
    return () => navigator.serviceWorker.removeEventListener('message', onMsg);
  }, [openAlertByKey]);

  const fire = useCallback(
    (a: AlertItem, opts: { sound: boolean; vibrate: boolean }) => {
      if (!setRef.current.notifications) return;

      setQueuedAlerts((prev) => {
        const filtered = prev.filter((x) => !(x.kind === a.kind && x.refId === a.refId));
        return [...filtered, a];
      });

      if (opts.sound) playSound();
      if (opts.vibrate && setRef.current.vibration && 'vibrate' in navigator) {
        navigator.vibrate([300, 150, 300, 150, 300]);
      }

      try {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          const n = new Notification(a.title, {
            body: a.body,
            tag: a.key,
            data: { key: a.key, kind: a.kind, refId: a.refId },
            silent: true,
          });
          n.onclick = () => {
            window.focus();
            openAlertByKey(a.key);
            n.close();
          };
        }
      } catch {
        /* some mobile browsers require a service worker */
      }
    },
    [playSound, openAlertByKey],
  );

  const getRetryMinutes = () => {
    const raw = setRef.current.reAlertMinutes ?? DEFAULT_RETRY_MINUTES;
    return typeof raw === 'number' && raw > 0 ? raw : DEFAULT_RETRY_MINUTES;
  };

  const tick = useCallback(() => {
    const now = Date.now();
    const h24 = setRef.current.hour24;
    let remChanged = false;

    const next = remRef.current.map((r) => {
      if (r.completed) return r;
      let x = r;
      if (x.advance > 0 && !x.snoozedUntil && x.firedAdv !== x.at && now >= x.at - x.advance * 60000 && now < x.at) {
        const mins = Math.round((x.at - now) / 60000);
        fire(
          {
            key: `adv:${x.id}:${x.at}`,
            kind: 'reminder',
            refId: x.id,
            title: x.title,
            body: `Coming up in ${mins} min (at ${fmtTimeStr(x.at, h24)})`,
            at: now,
          },
          { sound: x.sound, vibrate: x.vibrate },
        );
        x = { ...x, firedAdv: x.at };
      }
      const due = effectiveDue(x);
      if (now >= due && x.firedDue !== due) {
        if (now - due < 12 * 3600 * 1000) {
          fire(
            {
              key: `due:${x.id}:${due}`,
              kind: 'reminder',
              refId: x.id,
              title: x.title,
              body: `Reminder · ${fmtTimeStr(due, h24)}${x.contact ? ' · ' + x.contact : ''}${x.phone ? ' · ' + x.phone : ''}`,
              at: now,
            },
            { sound: x.sound, vibrate: x.vibrate },
          );
        }
        x = { ...x, snoozedUntil: undefined, firedDue: due };
      }
      if (x !== r) remChanged = true;
      return x;
    });
    if (remChanged) setReminders(next);

    const retries = retryRef.current;
    const dueRetryIds = Object.entries(retries)
      .filter(([, retryAt]) => now >= retryAt)
      .map(([id]) => id);

    if (dueRetryIds.length > 0) {
      const nextRetries = { ...retries };
      for (const id of dueRetryIds) {
        delete nextRetries[id];
        const rem = remRef.current.find((item) => item.id === id);
        if (rem && !rem.completed) {
          fire(
            {
              key: `retry:${rem.id}:${now}`,
              kind: 'reminder',
              refId: rem.id,
              title: rem.title,
              body: `Reminder · ${fmtTimeStr(now, h24)}${rem.contact ? ' · ' + rem.contact : ''}${rem.phone ? ' · ' + rem.phone : ''}`,
              at: now,
            },
            { sound: rem.sound, vibrate: rem.vibrate },
          );
        }
      }
      setPendingRetries(nextRetries);
    }

    let bdChanged = false;
    const nowD = new Date(now);
    const nextB = bdRef.current.map((b) => {
      let fired = b.fired;
      for (const y of [nowD.getFullYear(), nowD.getFullYear() + 1]) {
        const occ = birthdayAt(b, y).getTime();
        const age = turningAge(b, new Date(occ));
        const adv = occ - b.advanceDays * DAYMS;
        const kAdv = `${y}:adv`;
        const kDay = `${y}:day`;
        if (b.advanceDays > 0 && !fired.includes(kAdv) && now >= adv && now < occ) {
          fire(
            {
              key: `bd:${b.id}:${kAdv}`,
              kind: 'birthday',
              refId: b.id,
              title: `${b.name}'s birthday`,
              body: `In ${b.advanceDays} day${b.advanceDays > 1 ? 's' : ''}${age > 0 ? ` · turns ${age}` : ''}`,
              at: now,
            },
            { sound: true, vibrate: true },
          );
          fired = [...fired, kAdv];
        }
        if (!fired.includes(kDay) && now >= occ && now < occ + DAYMS) {
          fire(
            {
              key: `bd:${b.id}:${kDay}`,
              kind: 'birthday',
              refId: b.id,
              title: `🎂 ${b.name}'s birthday today`,
              body: age > 0 ? `Turns ${age} today` : 'Today!',
              at: now,
            },
            { sound: true, vibrate: true },
          );
          fired = [...fired, kDay];
        }
      }
      const pruned = fired.filter((k) => Number(k.split(':')[0]) >= nowD.getFullYear() - 1);
      if (pruned.length !== b.fired.length || pruned.some((k, i) => k !== b.fired[i])) {
        bdChanged = true;
        return { ...b, fired: pruned };
      }
      return b;
    });
    if (bdChanged) setBirthdays(nextB);
  }, [fire]);

  useEffect(() => {
    tick();
    const id = window.setInterval(tick, 5000);
    const vis = () => document.visibilityState === 'visible' && tick();
    document.addEventListener('visibilitychange', vis);
    window.addEventListener('focus', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', vis);
      window.removeEventListener('focus', tick);
    };
  }, [tick]);

  const clearPendingRetry = useCallback((id: string) => {
    setPendingRetries((prev) => {
      if (!(id in prev)) return prev;
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }, []);

  /* ---------- actions ---------- */
  const saveReminder = useCallback((r: Reminder) => {
    setReminders((list) => (list.some((x) => x.id === r.id) ? list.map((x) => (x.id === r.id ? r : x)) : [...list, r]));
  }, []);

  const deleteReminder = useCallback(
    (id: string) => {
      setReminders((l) => l.filter((x) => x.id !== id));
      setAlerts((a) => a.filter((x) => x.refId !== id));
      setQueuedAlerts((q) => q.filter((x) => x.refId !== id));
      clearPendingRetry(id);
    },
    [clearPendingRetry],
  );

  const completeReminder = useCallback(
    (id: string) => {
      const now = Date.now();
      setReminders((list) =>
        list.map((x) => {
          if (x.id !== id) return x;
          if (!x.repeat || x.repeat.type === 'none') {
            return { ...x, completed: true, completedAt: now, snoozedUntil: undefined };
          }
          const nx = nextOccurrence({ ...x, snoozedUntil: undefined }, x.at);
          if (nx && nx > x.at) {
            return {
              ...x,
              at: nx,
              completed: false,
              completedAt: undefined,
              snoozedUntil: undefined,
              firedDue: undefined,
              firedAdv: undefined,
            };
          }
          return { ...x, completed: true, completedAt: now, snoozedUntil: undefined };
        }),
      );
      setAlerts((a) => a.filter((x) => x.refId !== id));
      setQueuedAlerts((q) => q.filter((x) => x.refId !== id));
      clearPendingRetry(id);
      stopSound();
    },
    [clearPendingRetry, stopSound],
  );

  const restoreReminder = useCallback((id: string) => {
    setReminders((list) =>
      list.map((x) => {
        if (x.id !== id) return x;
        return { ...x, completed: false, completedAt: undefined, snoozedUntil: undefined, firedDue: undefined, firedAdv: undefined };
      }),
    );
  }, []);

  const snoozeReminder = useCallback(
    (id: string, minutes: number) => {
      const mins = minutes > 0 ? minutes : getRetryMinutes();
      setReminders((list) => list.map((x) => (x.id === id ? { ...x, snoozedUntil: Date.now() + mins * 60000 } : x)));
      setAlerts((a) => a.filter((x) => x.refId !== id));
      setQueuedAlerts((q) => q.filter((x) => x.refId !== id));
      clearPendingRetry(id);
      stopSound();
    },
    [clearPendingRetry, stopSound],
  );

  const dismissAlert = useCallback(
    (key: string) => {
      const found = alertsRef.current.find((a) => a.key === key) ?? queuedRef.current.find((a) => a.key === key);
      setAlerts((prev) => prev.filter((a) => a.key !== key));
      setQueuedAlerts((prev) => prev.filter((a) => a.key !== key));
      stopSound();
      if (found && found.kind === 'reminder') {
        const mins = getRetryMinutes();
        setPendingRetries((prev) => ({
          ...prev,
          [found.refId]: Date.now() + mins * 60000,
        }));
        toast(`Will re-alert in ${mins} min`);
      }
    },
    [stopSound, toast],
  );

  const saveBirthday = useCallback((b: Birthday) => {
    setBirthdays((list) => (list.some((x) => x.id === b.id) ? list.map((x) => (x.id === b.id ? b : x)) : [...list, b]));
  }, []);

  const deleteBirthday = useCallback((id: string) => {
    setBirthdays((list) => list.filter((x) => x.id !== id));
    setAlerts((a) => a.filter((x) => !(x.kind === 'birthday' && x.refId === id)));
    setQueuedAlerts((q) => q.filter((x) => !(x.kind === 'birthday' && x.refId === id)));
  }, []);

  const requestComplete = useCallback(
    async (id: string) => {
      if (setRef.current.confirmCompletion) {
        const ok = await ask('Mark this reminder as completed?', 'Complete');
        if (!ok) return;
      }
      completeReminder(id);
    },
    [ask, completeReminder],
  );

  const requestDelete = useCallback(
    async (id: string) => {
      if (setRef.current.confirmRemoval) {
        const ok = await ask('Delete this reminder?', 'Delete');
        if (!ok) return;
      }
      deleteReminder(id);
      toast('Reminder deleted');
    },
    [ask, deleteReminder, toast],
  );

  const requestDeleteBirthday = useCallback(
    async (id: string) => {
      if (setRef.current.confirmRemoval) {
        const ok = await ask('Delete this birthday?', 'Delete');
        if (!ok) return;
      }
      deleteBirthday(id);
      toast('Birthday deleted');
    },
    [ask, deleteBirthday, toast],
  );

  const updateSettings = useCallback((p: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...p }));
  }, []);

  const setLastBackup = useCallback((t: number) => {
    setLastBackupState(t);
    save('qx.lastBackup', t);
  }, []);

  const importData = useCallback((data: unknown) => {
    if (!data || typeof data !== 'object') throw new Error('Invalid backup format');
    const obj = data as { reminders?: unknown; birthdays?: unknown };
    let addedR = 0;
    let addedB = 0;
    let skipped = 0;

    if (Array.isArray(obj.reminders)) {
      const existingIds = new Set(remRef.current.map((r) => r.id));
      const validNew: Reminder[] = [];
      for (const item of obj.reminders) {
        if (!item || typeof item !== 'object') {
          skipped++;
          continue;
        }
        const r = item as Reminder;
        if (typeof r.id !== 'string' || typeof r.title !== 'string' || typeof r.at !== 'number') {
          skipped++;
          continue;
        }
        if (existingIds.has(r.id)) {
          skipped++;
          continue;
        }
        existingIds.add(r.id);
        validNew.push({
          ...r,
          color: r.color ?? 'default',
          repeat: r.repeat ?? { type: 'none', weekdays: [], interval: 1, unit: 'day' },
          contact: r.contact ?? '',
          phone: r.phone ?? '',
          advance: r.advance ?? 0,
          sound: r.sound ?? true,
          vibrate: r.vibrate ?? true,
          completed: !!r.completed,
          createdAt: r.createdAt ?? Date.now(),
        });
        addedR++;
      }
      if (validNew.length > 0) setReminders((prev) => [...prev, ...validNew]);
    }

    if (Array.isArray(obj.birthdays)) {
      const existingIds = new Set(bdRef.current.map((b) => b.id));
      const validNew: Birthday[] = [];
      for (const item of obj.birthdays) {
        if (!item || typeof item !== 'object') {
          skipped++;
          continue;
        }
        const b = item as Birthday;
        if (typeof b.id !== 'string' || typeof b.name !== 'string' || typeof b.dob !== 'string') {
          skipped++;
          continue;
        }
        if (existingIds.has(b.id)) {
          skipped++;
          continue;
        }
        existingIds.add(b.id);
        validNew.push({
          ...b,
          comment: b.comment ?? '',
          time: b.time ?? '10:00',
          advanceDays: b.advanceDays ?? 0,
          color: b.color ?? 'blue',
          fired: Array.isArray(b.fired) ? b.fired : [],
          createdAt: b.createdAt ?? Date.now(),
        });
        addedB++;
      }
      if (validNew.length > 0) setBirthdays((prev) => [...prev, ...validNew]);
    }

    return { addedR, addedB, skipped };
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      reminders,
      birthdays,
      settings,
      updateSettings,
      saveReminder,
      deleteReminder,
      completeReminder,
      restoreReminder,
      snoozeReminder,
      saveBirthday,
      deleteBirthday,
      requestComplete,
      requestDelete,
      requestDeleteBirthday,
      importData,
      alerts,
      openAlertByKey,
      dismissAlert,
      toastMsg,
      toast,
      confirmState,
      ask,
      answerConfirm,
      permission,
      requestPermission,
      playSound,
      stopSound,
      ringtoneUrl,
      setRingtone,
      lastBackup,
      setLastBackup,
    }),
    [
      reminders,
      birthdays,
      settings,
      updateSettings,
      saveReminder,
      deleteReminder,
      completeReminder,
      restoreReminder,
      snoozeReminder,
      saveBirthday,
      deleteBirthday,
      requestComplete,
      requestDelete,
      requestDeleteBirthday,
      importData,
      alerts,
      openAlertByKey,
      dismissAlert,
      toastMsg,
      toast,
      confirmState,
      ask,
      answerConfirm,
      permission,
      requestPermission,
      playSound,
      stopSound,
      ringtoneUrl,
      setRingtone,
      lastBackup,
      setLastBackup,
    ],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}
