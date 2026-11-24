import { useEffect, useState } from 'react';
import { StoreProvider, useStore } from './lib/store';
import type { Birthday, Reminder } from './lib/types';
import { startOfDay } from './lib/dates';
import { BellIcon, CakeIcon, CalendarIcon, Dialog, MenuIcon, PlusIcon, TextBtn, CloseIcon, CheckIcon } from './components/ui';
import ReminderSheet from './components/ReminderSheet';
import Reminders from './screens/Reminders';
import Birthdays, { BirthdayForm } from './screens/Birthdays';
import CalendarScreen from './screens/CalendarScreen';
import More from './screens/More';
import SettingsScreen, { BackupScreen, BirthdaySettings, SnoozeSettings } from './screens/Settings';
import { AboutScreen, CompletedScreen, HelpScreen, PrivacyScreen } from './screens/Info';

export type Page = 'settings' | 'completed' | 'backup' | 'about' | 'privacy' | 'help' | 'snoozeSettings' | 'birthdaySettings';
type Tab = 'reminders' | 'birthdays' | 'calendar' | 'more';

const RED = '#dc2626';
const BLUE = '#2563eb';

function Shell() {
  const {
    settings,
    alerts,
    openAlertByKey,
    dismissAlert,
    completeReminder,
    confirmState,
    toastMsg,
    permission,
    requestPermission,
    toast,
  } = useStore();
  const [tab, setTab] = useState<Tab>('reminders');
  const [stack, setStack] = useState<Page[]>([]);
  const [sheet, setSheet] = useState<{ initial?: Reminder; preset?: Date } | null>(null);
  const [bform, setBform] = useState<{ initial?: Birthday } | null>(null);
  const [selected, setSelected] = useState(() => startOfDay(new Date()));
  const [bannerHidden, setBannerHidden] = useState(() => localStorage.getItem('qx.banner') === '1');

  useEffect(() => {
    const apply = () => {
      const dark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    };
    apply();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [settings.theme]);

  useEffect(() => {
    document.documentElement.style.fontSize = { small: '13px', medium: '14.5px', large: '16px' }[settings.fontSize];
  }, [settings.fontSize]);

  useEffect(() => {
    const o = screen.orientation as ScreenOrientation & { lock?: (t: string) => Promise<void> };
    try {
      if (settings.orientation === 'auto') o.unlock?.();
      else void o.lock?.(settings.orientation)?.catch(() => undefined);
    } catch {
      /* not supported outside fullscreen / installed mode */
    }
  }, [settings.orientation]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const alertKey = params.get('alert');
      if (alertKey) {
        openAlertByKey(alertKey);
        params.delete('alert');
        const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
        window.history.replaceState({}, '', nextUrl);
      }
    } catch {
      /* ignore url parse errors */
    }
  }, [openAlertByKey]);

  const go = (p: Page) => setStack((s) => [...s, p]);
  const back = () => setStack((s) => s.slice(0, -1));
  const page = stack[stack.length - 1];

  const accent = tab === 'birthdays' ? BLUE : RED;

  const onPlus = () => {
    if (tab === 'reminders') setSheet({});
    else if (tab === 'birthdays') setBform({});
    else if (tab === 'calendar') setSheet({ preset: selected });
    else toast('Open Reminders, Birthdays or Calendar to add something');
  };

  const dismissBanner = () => {
    localStorage.setItem('qx.banner', '1');
    setBannerHidden(true);
  };
  const showBanner = !bannerHidden && !page && !bform && tab === 'reminders';

  let body;
  if (page) {
    body =
      page === 'settings' ? <SettingsScreen onBack={back} go={go} /> :
      page === 'completed' ? <CompletedScreen onBack={back} /> :
      page === 'backup' ? <BackupScreen onBack={back} /> :
      page === 'about' ? <AboutScreen onBack={back} go={go} /> :
      page === 'privacy' ? <PrivacyScreen onBack={back} /> :
      page === 'help' ? <HelpScreen onBack={back} /> :
      page === 'snoozeSettings' ? <SnoozeSettings onBack={back} /> :
      <BirthdaySettings onBack={back} />;
  } else if (bform) {
    body = <BirthdayForm initial={bform.initial} onClose={() => setBform(null)} />;
  } else {
    body = (
      <>
        <div className="flex-1 min-h-0 flex flex-col anim-fade">
          {tab === 'reminders' && (
            <>
              {showBanner && (
                <div className="mx-3 mt-2 mb-1.5 rounded-2xl bg-surface border border-line p-3 text-xs text-sub relative shadow-sm anim-item">
                  <button aria-label="Dismiss" onClick={dismissBanner} className="absolute right-2.5 top-2.5 text-sub hover:text-main transition-colors">
                    <CloseIcon size={15} />
                  </button>
                  <p className="pr-5 leading-relaxed">
                    <b className="font-display text-main">Alerts need your permission.</b>{' '}
                    {permission === 'default'
                      ? 'Allow notifications so reminders can appear at their time. Tap a notification to open its actions.'
                      : permission === 'denied'
                        ? 'Notifications are blocked for this site; allow notifications in browser settings to get top alerts.'
                        : 'This browser has no notification support.'}
                  </p>
                  {permission === 'default' && (
                    <button
                      onClick={() => void requestPermission()}
                      className="mt-2 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-display font-bold text-xs shadow-xs active:scale-95 transition-all"
                    >
                      Allow notifications
                    </button>
                  )}
                </div>
              )}
              <div className="flex-1 min-h-0">
                <Reminders onEdit={(r) => setSheet({ initial: r })} go={go} />
              </div>
            </>
          )}
          {tab === 'birthdays' && <Birthdays onEdit={(b) => setBform({ initial: b })} go={go} />}
          {tab === 'calendar' && (
            <CalendarScreen
              selected={selected}
              setSelected={setSelected}
              onEdit={(r) => setSheet({ initial: r })}
              onEditBirthday={(b) => setBform({ initial: b })}
              onAdd={() => setSheet({ preset: selected })}
              go={go}
            />
          )}
          {tab === 'more' && <More go={go} />}
        </div>

        <nav className="relative shrink-0 glass-surface border-t border-line grid grid-cols-5 items-end h-[58px] pb-1" aria-label="Main">
          <NavBtn label="Reminders" active={tab === 'reminders'} color={RED} onClick={() => setTab('reminders')} icon={<BellIcon size={19} />} />
          <NavBtn label="Birthdays" active={tab === 'birthdays'} color={BLUE} onClick={() => setTab('birthdays')} icon={<CakeIcon size={19} />} />
          <div className="flex justify-center items-center h-full">
            <button
              onClick={onPlus}
              aria-label={tab === 'reminders' ? 'Add reminder' : tab === 'birthdays' ? 'Add birthday' : tab === 'calendar' ? 'Add event' : 'Add (not available here)'}
              aria-disabled={tab === 'more'}
              className={`w-[44px] h-[44px] rounded-2xl grid place-items-center text-white shadow-md active:scale-90 hover:scale-105 transition-all duration-200 ${
                tab !== 'more' ? 'anim-ring' : ''
              }`}
              style={{ background: tab === 'more' ? '#9ca3af' : accent }}
            >
              <PlusIcon size={22} />
            </button>
          </div>
          <NavBtn label="Calendar" active={tab === 'calendar'} color={RED} onClick={() => setTab('calendar')} icon={<CalendarIcon size={19} />} />
          <NavBtn label="More" active={tab === 'more'} color={RED} onClick={() => setTab('more')} icon={<MenuIcon size={19} />} />
        </nav>
      </>
    );
  }

  return (
    <div className="h-full flex justify-center items-stretch md:items-center">
      <div className="relative w-full max-w-[430px] h-full md:h-[min(100%,860px)] md:rounded-3xl md:shadow-2xl overflow-hidden bg-app text-main flex flex-col">
        {body}

        {sheet && <ReminderSheet key={sheet.initial?.id ?? 'new'} initial={sheet.initial} presetDate={sheet.preset} onClose={() => setSheet(null)} />}

        {alerts.length > 0 && (
          <div className="absolute inset-0 z-[60] bg-black/65 backdrop-blur-xs grid place-items-center p-4 anim-fade">
            <div className="w-full max-w-[340px] space-y-3 max-h-full overflow-y-auto">
              {alerts.map((a) => {
                const isBirthday = a.kind === 'birthday';
                return (
                  <div
                    key={a.key}
                    role="alertdialog"
                    aria-label={a.title}
                    className="relative overflow-hidden bg-surface text-main rounded-2xl shadow-2xl border border-line/60 anim-pop"
                  >
                    <div className={`h-1.5 w-full ${isBirthday ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gradient-to-r from-red-500 via-rose-600 to-orange-500'}`} />

                    <div className="p-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${isBirthday ? 'bg-blue-500/10 text-blue-600' : 'bg-red-500/10 text-red-600'}`}>
                          {isBirthday ? <CakeIcon size={18} /> : <BellIcon size={18} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className={`inline-block font-display text-[0.65rem] uppercase font-bold tracking-wider ${isBirthday ? 'text-blue-600' : 'text-red-600'}`}>
                            {isBirthday ? 'Birthday Alert' : 'Reminder'}
                          </span>
                          <p className="text-xs text-sub truncate">{a.body}</p>
                        </div>
                        <img
                          src="/logo.png"
                          alt="QX"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                          className="w-7 h-7 rounded-lg object-cover shrink-0"
                        />
                      </div>

                      <h3 className="font-display text-base font-bold mt-2.5 leading-snug break-words">{a.title}</h3>

                      <div className="flex gap-2 mt-3.5">
                        {!isBirthday && (
                          <button
                            onClick={() => completeReminder(a.refId)}
                            className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                          >
                            <CheckIcon size={16} />
                            Complete
                          </button>
                        )}
                        <button
                          onClick={() => dismissAlert(a.key)}
                          className="flex-1 py-2 px-3 rounded-xl bg-band hover:opacity-90 text-main font-display text-xs font-bold active:scale-95 transition-all"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {confirmState && <ConfirmHost />}

        {toastMsg && (
          <div role="status" className="absolute left-4 right-4 bottom-18 z-[70] flex justify-center pointer-events-none anim-pop">
            <div className="bg-gray-900/95 text-white font-display text-xs font-medium px-3.5 py-2 rounded-full shadow-lg border border-white/10">
              {toastMsg}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfirmHost() {
  const { confirmState, answerConfirm } = useStore();
  return <ConfirmInner message={confirmState!.message} ok={confirmState!.okLabel} onResult={answerConfirm} />;
}

function ConfirmInner({ message, ok, onResult }: { message: string; ok: string; onResult: (v: boolean) => void }) {
  return (
    <Dialog
      onClose={() => onResult(false)}
      actions={
        <>
          <TextBtn color="var(--sub)" onClick={() => onResult(false)}>Cancel</TextBtn>
          <TextBtn onClick={() => onResult(true)}>{ok}</TextBtn>
        </>
      }
    >
      <p className="px-3 py-2 text-sm leading-relaxed">{message}</p>
    </Dialog>
  );
}

function NavBtn({ label, active, color, onClick, icon }: { label: string; active: boolean; color: string; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className="flex flex-col items-center justify-center h-full gap-0.5 active:scale-90 transition-transform"
      style={{ color: active ? color : 'var(--sub)' }}
    >
      {icon}
      <span className="font-display text-[0.65rem] font-bold tracking-tight">{label}</span>
    </button>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
