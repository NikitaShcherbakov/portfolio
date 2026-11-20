import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

import { useListenToBand } from '../hooks/use-listen-to-band';
import { useMagazineStore } from '../stores/magazine-store';
import { focusKeys } from '../utils/focus';
import type { MagazineEntry } from '../utils/magazine-entries';

const rings = [
  {
    className: 'j-ring',
    strokeWidth: '1.8',
    path: 'M18 9C60 1 160 0 192 14s-4 40-90 43S3 48 4 30 40 6 120 6',
  },
  {
    className: 'j-ring j-ring2',
    strokeWidth: '1.6',
    path: 'M24 6C80 -2 170 2 196 18s-10 38-96 41S0 50 2 28 50 2 140 4',
  },
] as const;

type ListenButtonProps = {
  entry: MagazineEntry;
  children?: ReactNode;
};

export function ListenButton({ entry, children }: ListenButtonProps) {
  const { t } = useTranslation();
  const listenTap = useMagazineStore.use.listenTap();
  const listen = useListenToBand(entry);
  const { band, track } = entry;
  const tapClass =
    listenTap?.trackId === track.id && `tap${String(listenTap.count % 2)}`;

  return (
    <div className="k-foot">
      <div className="j-end">
        <button
          type="button"
          className={cn('j-listen', tapClass)}
          data-focus-key={focusKeys.Listen}
          aria-label={t('magazine.listen.label', {
            name: band.name,
            song: track.title,
          })}
          onClick={listen}
        >
          <i>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 4v16l13-8z" />
            </svg>
          </i>
          <span>
            <small>{t('magazine.listen.caption')}</small>
            <b>{track.title}</b>
          </span>
          {rings.map(({ className, strokeWidth, path }) => (
            <svg
              key={className}
              className={className}
              aria-hidden="true"
              viewBox="0 0 200 60"
              preserveAspectRatio="none"
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            >
              <path pathLength="1" d={path} />
            </svg>
          ))}
        </button>
      </div>
      {children}
    </div>
  );
}
