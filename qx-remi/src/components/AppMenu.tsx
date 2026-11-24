import { useState } from 'react';
import { DotsIcon, IconBtn } from './ui';
import type { Page } from '../App';

export default function AppMenu({ go }: { go: (p: Page) => void }) {
  const [open, setOpen] = useState(false);
  const items: { l: string; p: Page }[] = [
    { l: 'Settings', p: 'settings' },
    { l: 'Completed', p: 'completed' },
    { l: 'Backup & Restore', p: 'backup' },
    { l: 'About', p: 'about' },
  ];
  return (
    <div className="relative">
      <IconBtn label="More options" onClick={() => setOpen((v) => !v)}>
        <DotsIcon size={20} />
      </IconBtn>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-40 bg-surface text-main rounded-2xl shadow-xl border border-line py-1.5 min-w-[185px] anim-pop">
            {items.map((i) => (
              <button
                key={i.p}
                className="w-full text-left px-4 py-2.5 text-sm font-display font-medium hover:bg-black/[0.03] active:bg-black/[0.07] transition-colors"
                onClick={() => {
                  setOpen(false);
                  go(i.p);
                }}
              >
                {i.l}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
