import { useStore } from '../lib/store';
import {
  BackupIcon,
  CheckBoxIcon,
  ChevronR,
  GearIcon,
  HelpIcon,
  InfoIcon,
  Row,
  Section,
  ShieldIcon,
  TopBar,
} from '../components/ui';
import type { Page } from '../App';

export default function More({ go }: { go: (p: Page) => void }) {
  const { reminders, birthdays } = useStore();
  const done = reminders.filter((r) => r.completed).length;
  const active = reminders.filter((r) => !r.completed).length;
  const chev = <ChevronR size={18} className="text-sub" />;

  return (
    <div className="flex flex-col h-full anim-fade">
      <TopBar title="More" />
      <div className="flex-1 overflow-y-auto pb-6">
        <div className="mx-3.5 mt-2.5 mb-1.5 rounded-2xl bg-surface border border-line p-3 shadow-sm anim-pop">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-surface-2 py-2 px-2">
              <div className="font-display font-bold text-base text-main">{active}</div>
              <div className="text-[0.68rem] text-sub">Active</div>
            </div>
            <div className="rounded-xl bg-surface-2 py-2 px-2">
              <div className="font-display font-bold text-base text-emerald-600">{done}</div>
              <div className="text-[0.68rem] text-sub">Completed</div>
            </div>
            <div className="rounded-xl bg-surface-2 py-2 px-2">
              <div className="font-display font-bold text-base text-blue-600">{birthdays.length}</div>
              <div className="text-[0.68rem] text-sub">Birthdays</div>
            </div>
          </div>
        </div>

        <Section>
          <Row
            icon={
              <span className="w-7 h-7 rounded-lg bg-red-500/10 text-red-600 grid place-items-center">
                <GearIcon size={16} />
              </span>
            }
            title={<span className="font-display font-semibold">Settings</span>}
            onClick={() => go('settings')}
            right={chev}
          />
          <Row
            icon={
              <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 grid place-items-center">
                <CheckBoxIcon size={16} />
              </span>
            }
            title={<span className="font-display font-semibold">Completed</span>}
            onClick={() => go('completed')}
            right={chev}
          />
        </Section>

        <Section>
          <Row
            icon={
              <span className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 grid place-items-center">
                <BackupIcon size={16} />
              </span>
            }
            title={<span className="font-display font-semibold">Backup &amp; Restore</span>}
            onClick={() => go('backup')}
            right={chev}
          />
        </Section>

        <Section>
          <Row
            icon={
              <span className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 grid place-items-center">
                <InfoIcon size={16} />
              </span>
            }
            title={<span className="font-display font-semibold">About</span>}
            onClick={() => go('about')}
            right={chev}
          />
          <Row
            icon={
              <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 grid place-items-center">
                <ShieldIcon size={16} />
              </span>
            }
            title={<span className="font-display font-semibold">Privacy Policy</span>}
            onClick={() => go('privacy')}
            right={chev}
          />
          <Row
            icon={
              <span className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 grid place-items-center">
                <HelpIcon size={16} />
              </span>
            }
            title={<span className="font-display font-semibold">Help &amp; Support</span>}
            onClick={() => go('help')}
            right={chev}
          />
        </Section>
      </div>
    </div>
  );
}
