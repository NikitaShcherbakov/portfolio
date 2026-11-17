import type { CSSProperties } from 'react';

type Sticker =
  | 'acoustic'
  | 'amp'
  | 'bassr'
  | 'bob'
  | 'bolt'
  | 'burst'
  | 'burstl'
  | 'cassette'
  | 'cat'
  | 'chibi'
  | 'dbolt'
  | 'dheart'
  | 'dspiral'
  | 'dstar'
  | 'dstarb'
  | 'flame'
  | 'flame2'
  | 'gblue'
  | 'gred'
  | 'hanko'
  | 'heart'
  | 'knob'
  | 'long'
  | 'mic'
  | 'okay'
  | 'paintr'
  | 'pedal'
  | 'phones'
  | 'pick'
  | 'punk'
  | 'record'
  | 'skel'
  | 'skull'
  | 'smile'
  | 'snare'
  | 'star'
  | 'sticks'
  | 'vblk'
  | 'warn';

type Note = 'soHot' | 'listen' | 'hit' | 'rockOn';

type DecoItem =
  | { sticker: Sticker; style: CSSProperties }
  | { note: Note; style: CSSProperties };

type DecoLayout = {
  isLeadMarked: boolean;
  items: readonly DecoItem[];
};

type Placement = {
  left: number;
  top: number;
  rotate: number;
};

type StickerPlacement = Placement & {
  width: number;
};

type NotePlacement = Placement & {
  size: number;
  color: string;
  font?: keyof typeof noteFonts;
};

const noteFonts = {
  Script: "'Bad Script',cursive",
  Marker: "'Permanent Marker',cursive",
} as const;

function getPlacementStyle({ left, top, rotate }: Placement): CSSProperties {
  return {
    left: `${String(left)}%`,
    top: `${String(top)}%`,
    transform: `rotate(${String(rotate)}deg)`,
  };
}

function sticker(
  name: Sticker,
  { width, ...placement }: StickerPlacement
): DecoItem {
  return {
    sticker: name,
    style: { ...getPlacementStyle(placement), width: `${String(width)}cqw` },
  };
}

function note(
  name: Note,
  { size, color, font = 'Script', ...placement }: NotePlacement
): DecoItem {
  return {
    note: name,
    style: {
      ...getPlacementStyle(placement),
      font: `400 ${String(size)}cqw ${noteFonts[font]}`,
      color,
    },
  };
}

const decoLayouts: readonly DecoLayout[] = [
  {
    isLeadMarked: false,
    items: [
      sticker('pick', { left: 87, top: 37, width: 3.6, rotate: 12 }),
      sticker('chibi', { left: 47.1, top: 83.08, width: 5.8, rotate: -6 }),
      sticker('bassr', { left: 60.75, top: 84.49, width: 15, rotate: -8 }),
      sticker('pick', { left: 91.2, top: 85.08, width: 3.4, rotate: 14 }),
    ],
  },
  {
    isLeadMarked: false,
    items: [
      sticker('dstar', { left: 82, top: 38, width: 3, rotate: 0 }),
      sticker('dheart', { left: 87.5, top: 37.6, width: 2.6, rotate: 0 }),
      sticker('dbolt', { left: 25, top: 48.5, width: 3, rotate: 0 }),
      sticker('long', { left: 47.1, top: 83.23, width: 5.8, rotate: 6 }),
      sticker('gred', { left: 59.7, top: 84.24, width: 13, rotate: -6 }),
      sticker('amp', { left: 85.95, top: 85.84, width: 5.4, rotate: 6 }),
    ],
  },
  {
    isLeadMarked: false,
    items: [
      note('soHot', {
        left: 84,
        top: 38.4,
        size: 1.4,
        color: '#b3122a',
        rotate: -6,
      }),
      sticker('skull', { left: 55.5, top: 85.5, width: 5, rotate: 10 }),
      sticker('flame', { left: 63.9, top: 84.15, width: 5.5, rotate: -6 }),
      sticker('flame2', { left: 71.78, top: 84.39, width: 5, rotate: 8 }),
      sticker('skull', { left: 84.9, top: 85.5, width: 5, rotate: -10 }),
    ],
  },
  {
    isLeadMarked: false,
    items: [
      sticker('hanko', { left: 88.5, top: 36.8, width: 3.4, rotate: 8 }),
      sticker('mic', { left: 52.35, top: 83.7, width: 3.6, rotate: -6 }),
      sticker('record', { left: 63.9, top: 84, width: 6, rotate: 8 }),
      sticker('burst', { left: 79.65, top: 83.99, width: 7.4, rotate: -6 }),
    ],
  },
  {
    isLeadMarked: false,
    items: [
      note('listen', {
        left: 85,
        top: 38.6,
        size: 1.5,
        color: '#1d2f6b',
        rotate: -4,
      }),
      sticker('dspiral', { left: 53, top: 48.5, width: 3, rotate: 0 }),
      sticker('skel', { left: 48.15, top: 83.23, width: 5.8, rotate: 4 }),
      sticker('snare', { left: 62.85, top: 86.06, width: 5.6, rotate: -8 }),
      sticker('cassette', { left: 77.55, top: 84.3, width: 8.6, rotate: -6 }),
    ],
  },
  {
    isLeadMarked: false,
    items: [
      sticker('pick', { left: 87, top: 37, width: 3.6, rotate: 12 }),
      sticker('star', { left: 49.2, top: 85.8, width: 4, rotate: -12 }),
      sticker('heart', { left: 57.6, top: 87.48, width: 3.8, rotate: 10 }),
      sticker('smile', { left: 66, top: 85.8, width: 4.2, rotate: -6 }),
      sticker('flame', { left: 74.4, top: 86.35, width: 4, rotate: 8 }),
      sticker('pick', { left: 82.8, top: 85.98, width: 3.4, rotate: 15 }),
      sticker('bolt', { left: 90.15, top: 85.28, width: 3.2, rotate: -10 }),
    ],
  },
  {
    isLeadMarked: false,
    items: [
      note('listen', {
        left: 85,
        top: 38.6,
        size: 1.5,
        color: '#1d2f6b',
        rotate: -4,
      }),
      sticker('punk', { left: 47.1, top: 83.23, width: 5.8, rotate: -4 }),
      sticker('vblk', { left: 59.7, top: 83.32, width: 13, rotate: -8 }),
      sticker('phones', { left: 87, top: 85.62, width: 5.4, rotate: 8 }),
    ],
  },
  {
    isLeadMarked: false,
    items: [
      sticker('pick', { left: 87, top: 37, width: 3.6, rotate: 12 }),
      sticker('sticks', { left: 22, top: 47.6, width: 3.8, rotate: 0 }),
      sticker('long', { left: 47.1, top: 83.23, width: 5.8, rotate: 5 }),
      sticker('acoustic', { left: 59.7, top: 84.62, width: 13, rotate: -6 }),
      sticker('pedal', { left: 88.05, top: 84.4, width: 4.2, rotate: 8 }),
    ],
  },
  {
    isLeadMarked: true,
    items: [
      note('hit', {
        left: 83,
        top: 37.6,
        size: 1.2,
        color: '#b3122a',
        rotate: -6,
      }),
      sticker('dstarb', { left: 88, top: 48.5, width: 3, rotate: 0 }),
      sticker('paintr', { left: 43.95, top: 84.67, width: 17, rotate: -3 }),
      note('rockOn', {
        left: 49.2,
        top: 85.4,
        size: 2.2,
        color: '#f3ece0',
        font: 'Marker',
        rotate: -4,
      }),
      sticker('bob', { left: 83.85, top: 83.23, width: 5.8, rotate: 5 }),
    ],
  },
  {
    isLeadMarked: false,
    items: [
      sticker('bolt', { left: 87, top: 37.5, width: 3.4, rotate: 10 }),
      sticker('cat', { left: 47.1, top: 83.23, width: 5.8, rotate: -5 }),
      sticker('gblue', { left: 60.75, top: 84.56, width: 12.5, rotate: -8 }),
      sticker('burstl', { left: 87, top: 85.2, width: 6.6, rotate: -6 }),
    ],
  },
  {
    isLeadMarked: false,
    items: [
      sticker('warn', { left: 52.35, top: 83.7, width: 6.2, rotate: 6 }),
      sticker('okay', { left: 68.1, top: 83.7, width: 6, rotate: -10 }),
      sticker('knob', { left: 84.9, top: 83.74, width: 5.6, rotate: -6 }),
    ],
  },
  {
    isLeadMarked: true,
    items: [
      sticker('pick', { left: 87, top: 37, width: 3.6, rotate: 12 }),
      sticker('chibi', { left: 48.15, top: 83.23, width: 5.8, rotate: -6 }),
      sticker('gred', { left: 60.75, top: 84.56, width: 12.5, rotate: -8 }),
      sticker('knob', { left: 85.95, top: 84.08, width: 5.4, rotate: 8 }),
    ],
  },
  {
    isLeadMarked: false,
    items: [
      sticker('dstar', { left: 82, top: 38, width: 3, rotate: 0 }),
      sticker('dheart', { left: 87.5, top: 37.6, width: 2.6, rotate: 0 }),
      sticker('dspiral', { left: 53, top: 48.5, width: 3, rotate: 0 }),
      sticker('cat', { left: 54.45, top: 83.58, width: 5.6, rotate: -8 }),
      sticker('punk', { left: 68.1, top: 83.28, width: 5.6, rotate: 4 }),
      sticker('skel', { left: 81.75, top: 83.93, width: 5.4, rotate: 10 }),
    ],
  },
  {
    isLeadMarked: false,
    items: [
      sticker('hanko', { left: 88.5, top: 36.8, width: 3.4, rotate: 8 }),
      sticker('dbolt', { left: 25, top: 48.5, width: 3, rotate: 0 }),
      sticker('bob', { left: 48.15, top: 83.23, width: 5.8, rotate: 6 }),
      sticker('record', { left: 62.85, top: 84, width: 6, rotate: -6 }),
      sticker('heart', { left: 78.6, top: 86.28, width: 3.8, rotate: -14 }),
      sticker('star', { left: 87, top: 86.7, width: 3.6, rotate: 10 }),
    ],
  },
];

export function getDecoLayout(bandIndex: number) {
  const layout = decoLayouts[bandIndex % decoLayouts.length];

  if (!layout) {
    throw new Error(`No sticker layout for band index ${String(bandIndex)}.`);
  }

  return layout;
}
