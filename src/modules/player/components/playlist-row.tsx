import type { CSSProperties } from 'react';

import type { Track } from '@/content/schemas';
import { cn } from '@/lib/utils';

import { getCoverPlaceholder } from '../utils/cover-placeholder';
import { formatDuration } from '../utils/format';

const coverSizePx = 40;

type PlaylistRowProps = {
  track: Track;
  trackNumber: string;
  isCurrent: boolean;
  rowIndex: number;
  listSize: number;
  top: number;
  staggerStep: number;
  isEntering: boolean;
  onSelect: () => void;
  onFocus: () => void;
};

export function PlaylistRow({
  track,
  trackNumber,
  isCurrent,
  rowIndex,
  listSize,
  top,
  staggerStep,
  isEntering,
  onSelect,
  onFocus,
}: PlaylistRowProps) {
  const style: CSSProperties & { '--i': number } = {
    '--i': staggerStep,
    position: 'absolute',
    top,
    left: 0,
    right: 0,
    animation: isEntering ? undefined : 'none',
  };

  return (
    <li style={style} aria-posinset={rowIndex + 1} aria-setsize={listSize}>
      <button
        type="button"
        className={cn('drawer-row', isCurrent && 'on')}
        aria-current={isCurrent ? 'true' : undefined}
        onClick={onSelect}
        onFocus={onFocus}
      >
        <span className="drawer-n">{trackNumber}</span>
        <img
          src={getCoverPlaceholder(track)}
          alt=""
          width={coverSizePx}
          height={coverSizePx}
          loading="lazy"
          className="drawer-art"
        />
        <span className="drawer-tt">
          <span className="drawer-title">{track.title}</span>
          <span className="drawer-artist">{track.artist}</span>
        </span>
        <span className="drawer-len">{formatDuration(track.durationSec)}</span>
      </button>
    </li>
  );
}
