import { useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { fmtHHMM, fmtDate } from '../lib/dates';
import { CaretDown, ChoiceDialog, Dialog, Row, Section, TextBtn, Toggle, TopBar } from '../components/ui';
import type { Page } from '../App';

type Dlg = null | 'theme' | 'font' | 'lang' | 'sound' | 'interval' | 'reAlert' | 'orientation' | 'firstDay';

export default function SettingsScreen({ onBack, go }: { onBack: () => void; go: (p: Page) => void }) {
  const { settings: s, updateSettings: set, permission, requestPermission, playSound, stopSound, setRingtone, toast, ringtoneUrl } = useStore();
  const [dlg, setDlg] = useState<Dlg>(null);
  const file = useRef<HTMLInputElement>(null);

  const onFile = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith('audio/')) return toast('Please choose an audio file');
    if (f.size > 2 * 1024 * 1024) return toast('File too large — choose an audio file under 2 MB');
    const reader = new FileReader();
    reader.onload = () => {
      if (setRingtone(String(reader.result), f.name)) toast('Custom ringtone set');
      else toast('Not enough local storage for this file');
    };
    reader.readAsDataURL(f);
  };

  const label = {
    theme: { light: 'Light', dark: 'Dark', system: 'System default' }[s.theme],
    font: { small: 'Small', medium: 'Medium', large: 'Large' }[s.fontSize],
    sound: { default: 'Default tone', custom: s.ringtoneName ? `Custom: ${s.ringtoneName}` : 'Custom ringtone', silent: 'Silent' }[s.soundMode],
    orientation: { auto: 'Auto-rotate', portrait: 'Portrait', landscape: 'Landscape' }[s.orientation],
    firstDay: { 1: 'Monday', 0: 'Sunday', 6: 'Saturday' }[s.firstDay],
  };

  return (
    <div className="flex flex-col h-full anim-fade">
      <TopBar title="Settings" onBack={onBack} />
      <div className="flex-1 overflow-y-auto pb-6 border-t border-line">
        <Section title="Appearance">
          <Row title="Theme" sub={label.theme} onClick={() => setDlg('theme')} />
          <Row title="Font size" sub={label.font} onClick={() => setDlg('font')} />
          <Row title="Language" sub="English" onClick={() => setDlg('lang')} />
        </Section>

        <Section title="Notifications">
          <Row
            title="Enable notifications"
            sub="Turn off to silence every reminder alert"
            right={<Toggle on={s.notifications} onChange={(v) => set({ notifications: v })} label="Enable notifications" />}
          />
          <Row
            title="System notification permission"
            sub={
              permission === 'granted'
                ? 'Allowed — alerts also appear as system notifications'
                : permission === 'denied'
                  ? 'Blocked — enable notifications for this site in your browser settings'
                  : permission === 'unsupported'
                    ? 'Not supported by this browser — in-app alerts only'
                    : 'Not requested yet — tap to allow (used only to show reminders)'
            }
            onClick={permission === 'default' ? requestPermission : undefined}
          />
          <Row title="Notification sound" sub={label.sound} onClick={() => setDlg('sound')} />
          <Row title="Custom ringtone" sub="Choose an audio file from your device storage (max 2 MB)" onClick={() => file.current?.click()} />
          <input ref={file} type="file" accept="audio/*" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
          <div className="px-4 py-3">
            <div className="flex justify-between text-xs font-display font-semibold text-main">
              <span>Notification volume</span>
              <span className="text-sub">{s.volume}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={s.volume}
              onChange={(e) => set({ volume: Number(e.target.value) })}
              aria-label="Notification volume"
              className="w-full mt-2"
            />
          </div>
          <Row
            title="Vibration"
            sub="Vibrate when a reminder fires (device support required)"
            right={<Toggle on={s.vibration} onChange={(v) => { set({ vibration: v }); if (v && 'vibrate' in navigator) navigator.vibrate(200); }} label="Vibration" />}
          />
          <Row
            title="Sound preview"
            sub={s.soundMode === 'custom' && !ringtoneUrl ? 'No custom ringtone selected yet' : 'Play the current sound at the selected volume'}
            onClick={() => { stopSound(); playSound(true); }}
          />
        </Section>

        <Section title="Reminder preferences">
          <Row
            title="Auto re-alert interval"
            sub={`Every ${s.reAlertMinutes ?? 5} minute${(s.reAlertMinutes ?? 5) > 1 ? 's' : ''} until marked Complete`}
            onClick={() => setDlg('reAlert')}
          />
          <Row title="Minimal interval" sub={`${s.minInterval} minute${s.minInterval > 1 ? 's' : ''}`} onClick={() => setDlg('interval')} />
          <Row title="Swipe to complete or snooze" right={<Toggle on={s.swipe} onChange={(v) => set({ swipe: v })} label="Swipe to complete or snooze" />} />
          <Row title="Add for tomorrow" sub="When enabled, the reminder date is set to tomorrow by default" right={<Toggle on={s.addTomorrow} onChange={(v) => set({ addTomorrow: v })} label="Add for tomorrow" />} />
          <Row title="Confirm removal" right={<Toggle on={s.confirmRemoval} onChange={(v) => set({ confirmRemoval: v })} label="Confirm removal" />} />
          <Row title="Confirm completion" right={<Toggle on={s.confirmCompletion} onChange={(v) => set({ confirmCompletion: v })} label="Confirm completion" />} />
          <Row title="Week number" sub="Show week numbers on the calendar" right={<Toggle on={s.weekNumber} onChange={(v) => set({ weekNumber: v })} label="Week number" />} />
          <Row title="Screen orientation" sub={label.orientation} onClick={() => setDlg('orientation')} />
          <Row title="24-Hour Time" sub={s.hour24 ? 'Showing 13:00' : 'Showing 1:00 PM'} right={<Toggle on={s.hour24} onChange={(v) => set({ hour24: v })} label="24-hour time" />} />
          <Row title="First day of the week" sub={label.firstDay} onClick={() => setDlg('firstDay')} />
        </Section>

        <Section>
          <Row title="Birthday" sub={`Default ${fmtHHMM(s.birthdayTime, s.hour24)}, ${s.birthdayAdvance ? s.birthdayAdvance + ' day(s) before' : 'no advance'}`} onClick={() => go('birthdaySettings')} />
          <Row title="Snooze..." sub={s.snoozes.map((m) => (m >= 60 && m % 60 === 0 ? m / 60 + 'h' : m + 'm')).join(', ')} onClick={() => go('snoozeSettings')} />
          <Row title="Backup & Restore" sub="Export or import all reminders and birthdays as a local JSON file" onClick={() => go('backup')} />
          <Row title="About QX Reminder" onClick={() => go('about')} />
        </Section>
      </div>

      {dlg === 'theme' && <ChoiceDialog title="Theme" value={s.theme} options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'system', label: 'System default' }]} onPick={(v) => set({ theme: v })} onClose={() => setDlg(null)} />}
      {dlg === 'font' && <ChoiceDialog title="Font size" value={s.fontSize} options={[{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }]} onPick={(v) => set({ fontSize: v })} onClose={() => setDlg(null)} />}
      {dlg === 'sound' && <ChoiceDialog title="Notification sound" value={s.soundMode} options={[{ value: 'default', label: 'Default tone' }, { value: 'custom', label: 'Custom ringtone' }, { value: 'silent', label: 'Silent' }]} onPick={(v) => { if (v === 'custom' && !ringtoneUrl) { toast('Pick an audio file first'); file.current?.click(); } else set({ soundMode: v }); }} onClose={() => setDlg(null)} />}
      {dlg === 'reAlert' && (
        <ChoiceDialog
          title="Auto re-alert interval"
          value={s.reAlertMinutes ?? 5}
          options={[1, 2, 3, 5, 10, 15, 30].map((v) => ({ value: v, label: `${v} minute${v > 1 ? 's' : ''}${v === 5 ? ' (Default)' : ''}` }))}
          onPick={(v) => set({ reAlertMinutes: v })}
          onClose={() => setDlg(null)}
        />
      )}
      {dlg === 'interval' && <ChoiceDialog title="Minimal interval" value={s.minInterval} options={[1, 5, 10, 15, 30].map((v) => ({ value: v, label: `${v} minute${v > 1 ? 's' : ''}` }))} onPick={(v) => set({ minInterval: v })} onClose={() => setDlg(null)} />}
      {dlg === 'orientation' && <ChoiceDialog title="Screen orientation" value={s.orientation} options={[{ value: 'auto', label: 'Auto-rotate' }, { value: 'portrait', label: 'Portrait' }, { value: 'landscape', label: 'Landscape' }]} onPick={(v) => { set({ orientation: v }); toast('Browsers only honor this when installed or in fullscreen'); }} onClose={() => setDlg(null)} />}
      {dlg === 'firstDay' && <ChoiceDialog<number> title="First day of the week" value={s.firstDay} options={[{ value: 1, label: 'Monday' }, { value: 0, label: 'Sunday' }, { value: 6, label: 'Saturday' }]} onPick={(v) => set({ firstDay: v as 0 | 1 | 6 })} onClose={() => setDlg(null)} />}
      {dlg === 'lang' && (
        <Dialog title="Language" onClose={() => setDlg(null)} actions={<TextBtn onClick={() => setDlg(null)}>OK</TextBtn>}>
          <p className="px-3 pb-1 text-main font-semibold">English (current)</p>
          <p className="px-3 pb-2 text-xs text-sub leading-relaxed">Only English is available in this version. The interface strings are not yet translated, so no other languages are offered rather than showing a non-working choice.</p>
        </Dialog>
      )}
    </div>
  );
}

export function SnoozeSettings({ onBack }: { onBack: () => void }) {
  const { settings, updateSettings, toast } = useStore();
  const [val, setVal] = useState('20');
  const fmt = (m: number) => (m >= 60 && m % 60 === 0 ? `${m / 60} hour${m > 60 ? 's' : ''}` : `${m} minute${m > 1 ? 's' : ''}`);
  const add = () => {
    const n = Math.round(Number(val));
    if (!n || n < 1 || n > 1440) return toast('Enter 1–1440 minutes');
    if (settings.snoozes.includes(n)) return toast('Already in the list');
    updateSettings({ snoozes: [...settings.snoozes, n].sort((a, b) => a - b) });
  };
  return (
    <div className="flex flex-col h-full anim-fade">
      <TopBar title="Snooze" onBack={onBack} />
      <div className="flex-1 overflow-y-auto border-t border-line">
        <p className="px-4 py-3 text-xs text-sub leading-relaxed">Snooze durations offered when snoozing a reminder. The first one is used by swipe-to-snooze.</p>
        <Section>
          {settings.snoozes.map((m, i) => (
            <Row
              key={m}
              title={fmt(m)}
              sub={i === 0 ? 'Used for swipe-to-snooze' : undefined}
              right={
                <button
                  className="text-red-600 font-display text-xs font-bold uppercase px-2 py-1 rounded-lg active:bg-red-500/10"
                  onClick={() => {
                    if (settings.snoozes.length <= 1) return toast('Keep at least one snooze duration');
                    updateSettings({ snoozes: settings.snoozes.filter((x) => x !== m) });
                  }}
                >
                  Remove
                </button>
              }
            />
          ))}
        </Section>
        <div className="flex items-center gap-3 px-4 py-4">
          <input
            type="number"
            min={1}
            max={1440}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            aria-label="Minutes"
            className="w-24 border-b-2 border-line bg-transparent py-1.5 text-center font-display text-main outline-none focus:border-red-600"
          />
          <span className="text-xs text-sub flex-1">minutes</span>
          <button onClick={add} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-display text-xs font-bold shadow-xs active:scale-95 transition-all">
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

export function BirthdaySettings({ onBack }: { onBack: () => void }) {
  const { settings, updateSettings } = useStore();
  return (
    <div className="flex flex-col h-full anim-fade">
      <TopBar title="Birthday" onBack={onBack} />
      <div className="flex-1 overflow-y-auto border-t border-line p-4 space-y-4">
        <p className="text-xs text-sub">Defaults used when you add a new birthday.</p>
        <label className="block">
          <span className="text-xs font-semibold text-sub">Default reminder time</span>
          <input
            type="time"
            value={settings.birthdayTime}
            onChange={(e) => updateSettings({ birthdayTime: e.target.value || '10:00' })}
            className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-main outline-none focus:border-blue-600"
          />
        </label>
        <label className="block relative">
          <span className="text-xs font-semibold text-sub">Default advance reminder</span>
          <select
            value={settings.birthdayAdvance}
            onChange={(e) => updateSettings({ birthdayAdvance: Number(e.target.value) })}
            className="mt-1.5 w-full appearance-none rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-main outline-none focus:border-blue-600"
          >
            {[0, 1, 2, 3, 5, 7, 14, 30].map((d) => (
              <option key={d} value={d} className="text-black">
                {d === 0 ? 'None' : d === 1 ? '1 day' : `${d} days`}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 bottom-3 text-sub">
            <CaretDown size={18} />
          </span>
        </label>
      </div>
    </div>
  );
}

export function BackupScreen({ onBack }: { onBack: () => void }) {
  const { reminders, birthdays, settings, importData, toast, lastBackup, setLastBackup } = useStore();
  const file = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState('');

  const buildJson = () =>
    JSON.stringify({ app: 'QX Reminder', format: 1, exportedAt: new Date().toISOString(), reminders, birthdays, settings }, null, 2);

  const exportNow = async () => {
    const name = `qx-reminder-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const json = buildJson();
    try {
      const w = window as unknown as { showSaveFilePicker?: (o: unknown) => Promise<{ createWritable: () => Promise<{ write: (d: string) => Promise<void>; close: () => Promise<void> }> }> };
      if (w.showSaveFilePicker) {
        const h = await w.showSaveFilePicker({ suggestedName: name, types: [{ description: 'QX Reminder backup', accept: { 'application/json': ['.json'] } }] });
        const wr = await h.createWritable();
        await wr.write(json);
        await wr.close();
      } else {
        const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
      }
      setLastBackup(Date.now());
      toast('Backup exported');
    } catch (e) {
      if ((e as Error).name !== 'AbortError') toast('Export failed');
    }
  };

  const onImport = async (f?: File) => {
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const r = importData(data);
      const msg = `Restored ${r.addedR} reminder(s) and ${r.addedB} birthday(s). ${r.skipped} item(s) skipped (already exist or invalid). Existing data was kept.`;
      setResult(msg);
      toast('Restore complete');
    } catch (e) {
      setResult((e as Error).message || 'Could not read this file.');
      toast('Restore failed');
    }
  };

  return (
    <div className="flex flex-col h-full anim-fade">
      <TopBar title="Backup & Restore" onBack={onBack} />
      <div className="flex-1 overflow-y-auto border-t border-line pb-6">
        <div className="mx-3.5 mt-3 rounded-2xl bg-surface border border-line p-3.5 text-xs text-sub space-y-1 shadow-xs anim-item">
          <p className="text-main font-display font-semibold">
            {reminders.filter((r) => !r.completed).length} active reminder(s) · {reminders.filter((r) => r.completed).length} completed · {birthdays.length} birthday(s)
          </p>
          <p>Last backup: {lastBackup ? `${fmtDate(new Date(lastBackup))}` : 'never'}</p>
        </div>

        <Section>
          <Row title="Export backup" sub="Save everything to a JSON file. You choose where it is saved." onClick={exportNow} />
          <Row title="Import backup" sub="Merge a previously exported file. Existing reminders are never overwritten or deleted." onClick={() => file.current?.click()} />
          <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { void onImport(e.target.files?.[0]); e.target.value = ''; }} />
        </Section>

        {result && (
          <p className="px-4 py-3 text-xs font-medium text-main anim-pop" role="status">
            {result}
          </p>
        )}

        <p className="px-4 pt-2 text-xs text-sub leading-relaxed">
          Backups never leave your device unless you move the file yourself. Browser storage can be cleared by the browser or OS, so export regularly. Custom ringtone audio is not included in backups.
        </p>
      </div>
    </div>
  );
}
