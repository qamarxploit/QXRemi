import { useEffect, useRef, useState, type ReactNode } from 'react';

type IconProps = { className?: string; size?: number };
const I = ({ d, className = '', size = 22, fill = true, children }: IconProps & { d?: string; fill?: boolean; children?: ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    fill={fill ? 'currentColor' : 'none'}
    stroke={fill ? 'none' : 'currentColor'}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {d ? <path d={d} /> : children}
  </svg>
);

export const BellIcon = (p: IconProps) => <I {...p} d="M12 22a2.2 2.2 0 0 0 2.2-2.2h-4.4A2.2 2.2 0 0 0 12 22Zm7-6.2V11a7 7 0 0 0-5.5-6.84V3.5a1.5 1.5 0 0 0-3 0v.66A7 7 0 0 0 5 11v4.8l-2 2V19h18v-1.2l-2-2Z" />;
export const CakeIcon = (p: IconProps) => (
  <I {...p}>
    <path d="M12 2c.9 1.1 1.4 1.9 1.4 2.6a1.4 1.4 0 0 1-2.8 0C10.6 3.9 11.1 3.1 12 2Z" />
    <path d="M11 8h2v3h5a2 2 0 0 1 2 2v1.2c-.9.3-1.6 1.1-2.5 1.1s-1.6-.8-2.5-.8-1.6.8-2.5.8-1.6-.8-2.5-.8-1.6.8-2.5.8S5.3 15.5 4.4 15.2V13a2 2 0 0 1 2-2H11V8Z" />
    <path d="M4 17c1 .2 1.7-.5 2.6-.5S8.3 17.3 9.3 17.3s1.7-.8 2.6-.8 1.7.8 2.6.8 1.7-.8 2.6-.8 1.6.7 2.9.5V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3Z" />
  </I>
);
export const CalendarIcon = (p: IconProps) => <I {...p} d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 16H5V9h14v11ZM8 12h4v4H8v-4Z" />;
export const MenuIcon = (p: IconProps) => <I {...p} d="M3 6h18v2.2H3V6Zm0 5h18v2.2H3V11Zm0 5h18v2.2H3V16Z" />;
export const PlusIcon = (p: IconProps) => <I {...p} d="M11 4h2v7h7v2h-7v7h-2v-7H4v-2h7V4Z" />;
export const SearchIcon = (p: IconProps) => <I {...p} d="M15.5 14h-.8l-.3-.3A6.5 6.5 0 1 0 14 15.5l.3.3v.8l5 5 1.5-1.5-5-5Zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Z" />;
export const DotsIcon = (p: IconProps) => <I {...p} d="M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm0 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />;
export const BackIcon = (p: IconProps) => <I {...p} d="M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20v-2Z" />;
export const CloseIcon = (p: IconProps) => <I {...p} d="M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6L19 6.4Z" />;
export const RepeatIcon = (p: IconProps) => <I {...p} d="M7 7h10v3l4-4-4-4v3H5v6h2V7Zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4Z" />;
export const ContactIcon = (p: IconProps) => <I {...p} d="M20 0H4v2h16V0ZM4 24h16v-2H4v2ZM20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm-8 2.8a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4ZM18 17H6v-1.1c0-2 4-3.1 6-3.1s6 1.1 6 3.1V17Z" />;
export const PhoneIcon = (p: IconProps) => <I {...p} d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1l-2.2 2.2Z" />;
export const HistoryIcon = (p: IconProps) => <I {...p} d="M13 3a9 9 0 0 0-9 9H1l4 3.9 4-3.9H6a7 7 0 1 1 2.05 4.95l-1.42 1.42A9 9 0 1 0 13 3Zm-1 5v5l4.3 2.5.75-1.23-3.55-2.1V8H12Z" />;
export const GearIcon = (p: IconProps) => <I {...p} d="M19.4 13a7.6 7.6 0 0 0 .06-1l2.1-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.6-.22l-2.5 1a7.3 7.3 0 0 0-1.7-1l-.38-2.65a.5.5 0 0 0-.5-.42h-4a.5.5 0 0 0-.5.42l-.38 2.65a7.3 7.3 0 0 0-1.7 1l-2.5-1a.5.5 0 0 0-.6.22l-2 3.46a.5.5 0 0 0 .12.64L4.54 12a7.6 7.6 0 0 0 0 2l-2.1 1.65a.5.5 0 0 0-.12.64l2 3.46c.13.22.4.3.6.22l2.5-1c.52.4 1.08.73 1.7 1l.38 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.38-2.65c.62-.27 1.2-.6 1.7-1l2.5 1c.23.09.48 0 .6-.22l2-3.46a.5.5 0 0 0-.12-.64L19.4 13ZM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" />;
export const CheckIcon = (p: IconProps) => <I {...p} d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z" />;
export const CheckBoxIcon = (p: IconProps) => <I {...p} d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm-9 14-5-5 1.4-1.4L10 14.2l7.6-7.6L19 8l-9 9Z" />;
export const TrashIcon = (p: IconProps) => <I {...p} d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z" />;
export const ClipboardIcon = (p: IconProps) => <I {...p} d="M19 3h-4.2A3 3 0 0 0 9.2 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm-7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm7 16H5V5h2v2h10V5h2v14Z" />;
export const SnoozeIcon = (p: IconProps) => <I {...p} d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 14.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13ZM9 9h5l-5 6h5v-1.5h-2.6L14 9v-1.5H9V9Z" />;
export const BackupIcon = (p: IconProps) => <I {...p} d="M19.35 10.04A7.5 7.5 0 0 0 5.1 8.5 5.5 5.5 0 0 0 5.5 19.5h13a4.5 4.5 0 0 0 .85-8.46ZM14 13v4h-4v-4H7l5-5 5 5h-3Z" />;
export const InfoIcon = (p: IconProps) => <I {...p} d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z" />;
export const ShieldIcon = (p: IconProps) => <I {...p} d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4Zm-1.2 15L7 12.2l1.4-1.4 2.4 2.4 4.8-4.8L17 9.8 10.8 16Z" />;
export const HelpIcon = (p: IconProps) => <I {...p} d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 17h-2v-2h2v2Zm2.07-7.75-.9.92A3.5 3.5 0 0 0 13 15h-2v-.5c0-1 .4-1.9 1.17-2.58l1.24-1.26A1.98 1.98 0 0 0 14 9c0-1.1-.9-2-2-2s-2 .9-2 2H8a4 4 0 0 1 8 0c0 .88-.36 1.68-.93 2.25Z" />;
export const ChevronL = (p: IconProps) => <I {...p} d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12l4.6-4.6Z" />;
export const ChevronR = (p: IconProps) => <I {...p} d="M8.6 16.6 10 18l6-6-6-6-1.4 1.4 4.6 4.6-4.6 4.6Z" />;
export const CaretDown = (p: IconProps) => <I {...p} d="M7 10l5 5 5-5H7Z" />;
export const PaletteIcon = (p: IconProps) => <I {...p} d="M12 3a9 9 0 0 0 0 18 1.5 1.5 0 0 0 1.1-2.5 1.5 1.5 0 0 1 1.1-2.5H16a5 5 0 0 0 5-5c0-4.4-4-8-9-8ZM6.5 12a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />;
export const CloudOffIcon = (p: IconProps) => <I {...p} d="M19.35 10.04A7.5 7.5 0 0 0 12 4a7.5 7.5 0 0 0-3.3.76l1.5 1.5A5.5 5.5 0 0 1 17.5 11H19a3 3 0 0 1 1.1 5.8l1.4 1.4A4.5 4.5 0 0 0 19.35 10.04ZM3 5.27l2.75 2.74A6 6 0 0 0 6 20h11.73l2 2L21 20.73 4.27 4 3 5.27ZM6 18a4 4 0 0 1-.4-7.98l.7-.07.3-.64.08-.15L16.7 18H6Z" />;
export const SpeakerIcon = (p: IconProps) => <I {...p} d="M3 9v6h4l5 5V4L7 9H3Zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4Z" />;

/* ---------- Layout helpers ---------- */

export function TopBar({ title, onBack, right }: { title: ReactNode; onBack?: () => void; right?: ReactNode }) {
  return (
    <header className="bg-app flex items-center h-13 px-3 shrink-0 text-main border-b border-line/60">
      {onBack && (
        <button
          onClick={onBack}
          aria-label="Back"
          className="w-9 h-9 grid place-items-center text-sub hover:text-main rounded-full active:bg-black/10 active:scale-90 transition-all mr-2"
        >
          <BackIcon size={20} />
        </button>
      )}
      <h1 className={`text-[1.18rem] font-display font-bold tracking-tight flex-1 truncate ${onBack ? '' : 'pl-1'}`}>
        {title}
      </h1>
      <div className="flex items-center gap-1 text-sub">{right}</div>
    </header>
  );
}

export function IconBtn({ children, onClick, label }: { children: ReactNode; onClick?: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-9 h-9 grid place-items-center rounded-full hover:bg-black/[0.05] active:bg-black/10 active:scale-90 transition-all"
    >
      {children}
    </button>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className="relative w-[42px] h-[24px] shrink-0 active:scale-95 transition-transform"
    >
      <span
        className="absolute inset-x-0 top-[4px] h-4 rounded-full transition-colors duration-200"
        style={{ background: on ? '#fca5a5' : '#cbd5e1' }}
      />
      <span
        className="absolute top-0 w-[24px] h-[24px] rounded-full shadow-sm transition-all duration-200"
        style={{ left: on ? 18 : 0, background: on ? '#dc2626' : '#ffffff' }}
      />
    </button>
  );
}

export function Row({
  title,
  sub,
  onClick,
  right,
  icon,
  danger,
}: {
  title: ReactNode;
  sub?: ReactNode;
  onClick?: () => void;
  right?: ReactNode;
  icon?: ReactNode;
  danger?: boolean;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3.5 px-4 py-3 transition-colors ${
        onClick ? 'hover:bg-black/[0.02] active:bg-black/[0.06] cursor-pointer' : ''
      }`}
    >
      {icon && <span className="text-sub w-6 grid place-items-center shrink-0">{icon}</span>}
      <span className="flex-1 min-w-0">
        <span className={`block text-[0.95rem] font-medium ${danger ? 'text-red-600' : 'text-main'}`}>{title}</span>
        {sub && <span className="block text-[0.78rem] text-sub leading-snug mt-0.5">{sub}</span>}
      </span>
      {right}
    </Tag>
  );
}

export function Section({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <section className="mt-2.5 anim-item">
      {title && (
        <h2 className="px-4 pb-1 pt-1.5 text-[0.7rem] font-display font-bold uppercase tracking-wider text-sub">
          {title}
        </h2>
      )}
      <div className="bg-surface border-y border-line divide-y divide-[var(--line)]">{children}</div>
    </section>
  );
}

/* ---------- Dialogs ---------- */

export function Dialog({ children, onClose, title, actions }: { children: ReactNode; onClose: () => void; title?: string; actions?: ReactNode }) {
  return (
    <div className="absolute inset-0 z-50 bg-black/55 backdrop-blur-[2px] grid place-items-center p-5 anim-fade" onClick={onClose}>
      <div
        role="dialog"
        aria-modal
        className="bg-surface text-main rounded-2xl w-full max-w-[340px] max-h-[85%] flex flex-col shadow-2xl border border-line/60 anim-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h3 className="px-4 pt-4 pb-1.5 text-base font-display font-bold">{title}</h3>}
        <div className="overflow-y-auto px-1.5 py-1 text-sm">{children}</div>
        {actions && <div className="flex justify-end gap-1.5 px-3 py-2.5">{actions}</div>}
      </div>
    </div>
  );
}

export function TextBtn({ children, onClick, color = '#dc2626', disabled }: { children: ReactNode; onClick?: () => void; color?: string; disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg font-display font-bold uppercase text-xs tracking-wider active:bg-black/10 active:scale-95 transition-all disabled:opacity-40"
      style={{ color }}
    >
      {children}
    </button>
  );
}

export function ChoiceDialog<T extends string | number>({
  title,
  options,
  value,
  onPick,
  onClose,
}: {
  title: string;
  options: { value: T; label: string }[];
  value?: T;
  onPick: (v: T) => void;
  onClose: () => void;
}) {
  return (
    <Dialog title={title} onClose={onClose} actions={<TextBtn onClick={onClose}>Cancel</TextBtn>}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => {
            onPick(o.value);
            onClose();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/[0.03] active:bg-black/[0.07] transition-colors text-left"
        >
          <span
            className="w-4 h-4 rounded-full border-2 grid place-items-center shrink-0 transition-colors"
            style={{ borderColor: o.value === value ? '#dc2626' : 'var(--sub)' }}
          >
            {o.value === value && <span className="w-2 h-2 rounded-full bg-red-600" />}
          </span>
          <span className="text-sm font-medium">{o.label}</span>
        </button>
      ))}
    </Dialog>
  );
}

/* ---------- Wheel picker ---------- */

const H = 46;
export function Wheel({ items, index, onChange, align = 'center' }: { items: string[]; index: number; onChange: (i: number) => void; align?: 'left' | 'center' }) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<number>(0);
  useEffect(() => {
    const el = ref.current;
    if (el && Math.abs(el.scrollTop - index * H) > 2) el.scrollTo({ top: index * H });
  }, [index, items.length]);
  const onScroll = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const i = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / H)));
      if (i !== index) onChange(i);
    }, 110);
  };
  return (
    <div ref={ref} onScroll={onScroll} className="wheel overflow-y-scroll snap-y snap-mandatory relative" style={{ height: H * 3 }}>
      <div style={{ height: H }} />
      {items.map((t, i) => (
        <button
          key={t + i}
          type="button"
          onClick={() => ref.current?.scrollTo({ top: i * H, behavior: 'smooth' })}
          style={{ height: H }}
          className={`snap-center w-full flex items-center font-display text-[1.15rem] transition-colors ${
            align === 'left' ? 'justify-start px-4' : 'justify-center'
          } ${i === index ? 'text-main font-bold' : 'text-sub'}`}
        >
          {t}
        </button>
      ))}
      <div style={{ height: H }} />
    </div>
  );
}

/* ---------- Swipe row ---------- */

export function SwipeRow({
  enabled,
  onRight,
  onLeft,
  leftLabel,
  children,
  onTap,
}: {
  enabled: boolean;
  onRight: () => void;
  onLeft: () => void;
  leftLabel: string;
  children: ReactNode;
  onTap: () => void;
}) {
  const [dx, setDx] = useState(0);
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const moved = useRef(false);
  const axis = useRef<'x' | 'y' | null>(null);
  const [anim, setAnim] = useState(false);

  const down = (e: React.PointerEvent) => {
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    moved.current = false;
    axis.current = null;
    setAnim(false);
  };
  const move = (e: React.PointerEvent) => {
    if (!start.current || !enabled) return;
    const mx = e.clientX - start.current.x;
    const my = e.clientY - start.current.y;
    if (!axis.current && (Math.abs(mx) > 8 || Math.abs(my) > 8)) axis.current = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
    if (axis.current === 'x') {
      moved.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      setDx(Math.max(-160, Math.min(160, mx)));
    }
  };
  const up = () => {
    if (!start.current) return;
    start.current = null;
    setAnim(true);
    if (axis.current === 'x') {
      if (dx > 90) onRight();
      else if (dx < -90) onLeft();
    } else if (!moved.current) {
      onTap();
    }
    setDx(0);
  };
  return (
    <div className="relative overflow-hidden bg-surface">
      <div className="absolute inset-0 flex text-white text-xs font-semibold">
        <div className="flex-1 flex items-center px-4 gap-1.5" style={{ background: dx > 0 ? '#059669' : 'transparent' }}>
          {dx > 0 && (
            <>
              <CheckIcon size={18} /> Complete
            </>
          )}
        </div>
        <div className="flex-1 flex items-center justify-end px-4 gap-1.5" style={{ background: dx < 0 ? '#2563eb' : 'transparent' }}>
          {dx < 0 && (
            <>
              {leftLabel} <SnoozeIcon size={18} />
            </>
          )}
        </div>
      </div>
      <div
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => {
          start.current = null;
          setDx(0);
        }}
        style={{ transform: `translateX(${dx}px)`, transition: anim ? 'transform .2s cubic-bezier(0.22, 1, 0.36, 1)' : 'none', touchAction: 'pan-y' }}
        className="relative bg-surface cursor-pointer select-none"
      >
        {children}
      </div>
    </div>
  );
}
