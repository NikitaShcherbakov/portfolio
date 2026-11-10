import type { ReactNode } from 'react';

type DeckIconProps = {
  children: ReactNode;
  size: number;
  height?: number;
  viewBox?: string;
  strokeWidth?: number;
};

function DeckIcon({
  children,
  size,
  height = size,
  viewBox = '0 0 24 24',
  strokeWidth,
}: DeckIconProps) {
  const paint =
    strokeWidth === undefined
      ? { fill: 'currentColor' }
      : {
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth,
          strokeLinecap: 'round' as const,
          strokeLinejoin: 'round' as const,
        };

  return (
    <svg
      width={size}
      height={height}
      viewBox={viewBox}
      aria-hidden="true"
      {...paint}
    >
      {children}
    </svg>
  );
}

export function PowerIcon() {
  return (
    <DeckIcon size={16} strokeWidth={2.6}>
      <path d="M12 3v8M6.3 6.8a8 8 0 1 0 11.4 0" />
    </DeckIcon>
  );
}

export function PreviousIcon() {
  return (
    <DeckIcon size={20}>
      <path d="M11 6v12L2 12zM21 6v12l-9-6z" />
    </DeckIcon>
  );
}

export function PlayPauseIcon() {
  return (
    <DeckIcon size={24} height={17} viewBox="0 0 34 24">
      <path d="M2 5v14l11-7z" />
      <rect x="18" y="5" width="4" height="14" />
      <rect x="25" y="5" width="4" height="14" />
    </DeckIcon>
  );
}

export function NextIcon() {
  return (
    <DeckIcon size={20}>
      <path d="M13 6v12l9-6zM3 6v12l9-6z" />
    </DeckIcon>
  );
}

export function ShuffleIcon() {
  return (
    <DeckIcon size={18} strokeWidth={2.2}>
      <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
    </DeckIcon>
  );
}

export function RepeatIcon() {
  return (
    <DeckIcon size={18} strokeWidth={2.2}>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4" />
      <path d="M21 13v2a3 3 0 0 1-3 3H3" />
    </DeckIcon>
  );
}

export function RandomIcon() {
  return (
    <DeckIcon size={18} strokeWidth={2}>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <circle cx="8.5" cy="8.5" r="1.4" fill="currentColor" />
      <circle cx="15.5" cy="15.5" r="1.4" fill="currentColor" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
    </DeckIcon>
  );
}

export function MinusIcon() {
  return (
    <DeckIcon size={14} strokeWidth={3}>
      <path d="M5 12h14" />
    </DeckIcon>
  );
}

export function PlusIcon() {
  return (
    <DeckIcon size={14} strokeWidth={3}>
      <path d="M5 12h14M12 5v14" />
    </DeckIcon>
  );
}

export function ListIcon() {
  return (
    <DeckIcon size={16} strokeWidth={2.2}>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </DeckIcon>
  );
}

export function SearchIcon() {
  return (
    <DeckIcon size={16} strokeWidth={2.2}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </DeckIcon>
  );
}
