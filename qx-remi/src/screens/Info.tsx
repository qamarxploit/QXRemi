import { useState } from 'react';
import { useStore } from '../lib/store';
import { COLORS } from '../lib/types';
import { fmtDate, fmtTime } from '../lib/dates';
import { ClipboardIcon, Row, Section, TopBar, TrashIcon, CheckIcon } from '../components/ui';

export const APP_VERSION = '1.0.0';

export function AboutScreen({ onBack, go }: { onBack: () => void; go: (p: 'privacy' | 'help') => void }) {
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="flex flex-col h-full anim-fade">
      <TopBar title="About" onBack={onBack} />
      <div className="flex-1 overflow-y-auto border-t border-line pb-6">
        <div className="flex flex-col items-center py-6 px-4 text-center">
          <div className="anim-float">
            {!logoError ? (
              <img
                src="/logo.png"
                alt="QX Reminder Logo"
                onError={() => setLogoError(true)}
                className="w-18 h-18 rounded-2xl object-cover shadow-lg border border-line/70 anim-pop"
              />
            ) : (
              <div className="w-18 h-18 rounded-2xl bg-red-600 grid place-items-center text-white text-2xl font-black shadow-lg anim-pop">
                QX
              </div>
            )}
          </div>

          <h2 className="mt-3 text-2xl font-display font-bold text-main tracking-tight">QX Reminder</h2>
          <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.7rem] font-semibold bg-band text-sub">
            Version {APP_VERSION}
          </span>
        </div>

        <Section title="Developer">
          <Row title={<span className="font-display font-bold">Qamar Abbas</span>} sub="Developer" />
          <Row title="Username" sub={<span className="font-display font-semibold text-main">qamarxploit</span>} />
          <a href="mailto:qamarorakzai09@gmail.com" className="block">
            <Row title="Email" sub="qamarorakzai09@gmail.com" />
          </a>
          <a href="https://qxstudio.pages.dev" target="_blank" rel="noopener noreferrer" className="block">
            <Row title="Website" sub="https://qxstudio.pages.dev" />
          </a>
        </Section>

        <Section>
          <Row title="Privacy Policy" onClick={() => go('privacy')} />
          <Row title="Help & Support" onClick={() => go('help')} />
        </Section>
      </div>
    </div>
  );
}

export function PrivacyScreen({ onBack }: { onBack: () => void }) {
  const p = (t: string, b: string) => (
    <div className="px-4 py-2.5 anim-item">
      <h3 className="font-display font-bold text-sm text-main">{t}</h3>
      <p className="text-xs text-sub mt-1 leading-relaxed">{b}</p>
    </div>
  );
  return (
    <div className="flex flex-col h-full anim-fade">
      <TopBar title="Privacy Policy" onBack={onBack} />
      <div className="flex-1 overflow-y-auto border-t border-line pb-6">
        <Section>
          {p('Summary', 'QX Reminder works locally on your device. Everything you enter stays in your browser storage.')}
          {p('Data we store', 'Reminders, birthdays, settings and (optionally) a custom ringtone file are saved in this device’s local storage.')}
          {p('Permissions', 'Notifications: only to show your reminders, and only after you allow it. Contacts: only when you pick a contact. Audio: only when you choose a ringtone file.')}
          {p('Backups', 'Backup files are created only when you tap Export and are saved where you choose.')}
          {p('Your control', 'You can delete any reminder or birthday at any time or clear site data.')}
          {p('Contact', 'Questions: qamarorakzai09@gmail.com')}
        </Section>
      </div>
    </div>
  );
}

export function HelpScreen({ onBack }: { onBack: () => void }) {
  const faq: [string, string][] = [
    ['Why didn’t my reminder alert me?', 'Allow notifications in Settings → Notifications. For timely alerts, keep the app open or in background and allow notifications for the site/app.'],
    ['How do auto re-alerts work?', 'If a reminder is dismissed without completing, it can re-alert after the configured interval until marked Complete.'],
    ['How do repeats work?', 'Open a reminder → Add a repeat to choose daily, weekly, monthly, yearly, weekdays, or custom interval.'],
    ['How do I move my data?', 'More → Backup & Restore to export or import a JSON backup file.'],
  ];
  return (
    <div className="flex flex-col h-full anim-fade">
      <TopBar title="Help & Support" onBack={onBack} />
      <div className="flex-1 overflow-y-auto border-t border-line pb-6">
        <Section>
          {faq.map(([q, a]) => (
            <div key={q} className="px-4 py-2.5 anim-item">
              <h3 className="font-display font-bold text-sm text-main">{q}</h3>
              <p className="text-xs text-sub mt-1 leading-relaxed">{a}</p>
            </div>
          ))}
        </Section>
        <Section title="Contact support">
          <a href="mailto:qamarorakzai09@gmail.com?subject=QX%20Reminder%20support" className="block">
            <Row title="Email the developer" sub="qamarorakzai09@gmail.com" />
          </a>
          <a href="https://qxstudio.pages.dev" target="_blank" rel="noopener noreferrer" className="block">
            <Row title="Website" sub="https://qxstudio.pages.dev" />
          </a>
        </Section>
      </div>
    </div>
  );
}

export function CompletedScreen({ onBack }: { onBack: () => void }) {
  const { reminders, settings, restoreReminder, deleteReminder, ask, toast } = useStore();
  const list = reminders.filter((r) => r.completed).sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
  const clearAll = async () => {
    if (!(await ask(`Permanently delete ${list.length} completed reminder(s)?`, 'Delete all'))) return;
    list.forEach((r) => deleteReminder(r.id));
    toast('Completed reminders cleared');
  };
  return (
    <div className="flex flex-col h-full anim-fade">
      <TopBar
        title="Completed"
        onBack={onBack}
        right={
          list.length > 0 ? (
            <button className="text-xs font-semibold uppercase text-red-600 px-2" onClick={clearAll}>
              Clear all
            </button>
          ) : undefined
        }
      />
      <div className="flex-1 overflow-y-auto border-t border-line">
        {list.length === 0 ? (
          <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-sub gap-2.5">
            <ClipboardIcon size={72} className="opacity-40" />
            <p className="text-base font-display">No completed reminders</p>
          </div>
        ) : (
          <div className="bg-surface border-y border-line divide-y divide-[var(--line)]">
            {list.map((r) => {
              const d = new Date(r.at);
              const t = fmtTime(d, settings.hour24);
              return (
                <div key={r.id} className="flex items-center min-h-[56px] pr-2 anim-item">
                  <span className="w-[4px] h-8 rounded-r" style={{ background: COLORS[r.color] }} />
                  <div className="flex-1 min-w-0 px-3.5 py-2">
                    <div className="text-sm text-sub line-through truncate">{r.title}</div>
                    <div className="text-[0.7rem] text-sub">
                      {fmtDate(d)} · {t.main} {t.suffix}
                    </div>
                  </div>
                  <button
                    aria-label="Restore"
                    className="w-9 h-9 grid place-items-center text-emerald-600 active:scale-90 transition-transform"
                    onClick={() => {
                      restoreReminder(r.id);
                      toast('Reminder restored');
                    }}
                  >
                    <CheckIcon size={20} />
                  </button>
                  <button
                    aria-label="Delete"
                    className="w-9 h-9 grid place-items-center text-sub active:scale-90 transition-transform"
                    onClick={() => deleteReminder(r.id)}
                  >
                    <TrashIcon size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
