import type { CSSProperties, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { BandCopy, SongCopy } from '@/content/schemas';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/modules/player';

import {
  formatMembers,
  getArticleDates,
  getBody,
  trimTrailingPeriod,
} from '../utils/article';
import type { MagazineEntry } from '../utils/magazine-entries';

type ArticleTextProps = {
  title: string;
  style?: CSSProperties;
  children: ReactNode;
};

function ArticleText({ title, style, children }: ArticleTextProps) {
  return (
    <p className="k-txt" style={style}>
      <span className="k-h">{title}</span> {children}
    </p>
  );
}

type ArticleDatesProps = {
  entry: MagazineEntry;
  isSolo: boolean;
};

function ArticleDates({ entry, isSolo }: ArticleDatesProps) {
  const { t } = useTranslation();

  return (
    <ArticleText
      title={t('magazine.article.dates')}
      style={{ textAlign: 'left' }}
    >
      {getArticleDates(entry).map(({ year, album, isHighlighted }) => (
        <span key={`${String(year)}-${album ?? ''}`} className="k-date">
          <b>{year}</b> —{' '}
          <span className={cn(isHighlighted && 'hl-y')}>
            {album === null
              ? t(
                  isSolo
                    ? 'magazine.article.foundedSolo'
                    : 'magazine.article.foundedBand'
                )
              : t('magazine.article.album', { title: album })}
          </span>
        </span>
      ))}
    </ArticleText>
  );
}

type ArticleBodyProps = {
  entry: MagazineEntry;
  bandCopy: BandCopy;
  songCopy: SongCopy;
  isLeadMarked: boolean;
};

export function ArticleBody({
  entry,
  bandCopy,
  songCopy,
  isLeadMarked,
}: ArticleBodyProps) {
  const { t } = useTranslation();
  const { band, track } = entry;
  const body = getBody(entry, bandCopy.body);
  const isSolo = band.kind === 'solo';

  return (
    <div className="k-body">
      <p className="k-lead">
        <span className={cn(isLeadMarked && 'lk-y')}>{songCopy.lead}</span>
      </p>
      <div className="k-song">
        <span className="k-h">{t('magazine.article.song')}</span>
        <span className="k-song-t hl-p">{track.title}</span>
        <span className="k-meta">
          {t('magazine.article.songMeta', {
            album: track.album,
            year: track.year,
            length: formatDuration(track.durationSec),
          })}
        </span>
      </div>
      <ArticleText title={t('magazine.article.trackStory')}>
        {songCopy.trackStory}
      </ArticleText>
      <div className="k-stats">
        {songCopy.stats.map((stat) => (
          <div key={stat.label} className="k-stat">
            <span className="k-stat-v">{stat.value}</span>
            <span className="k-stat-l">{stat.label}</span>
          </div>
        ))}
      </div>
      <ArticleText
        title={t(
          isSolo
            ? 'magazine.article.historySolo'
            : 'magazine.article.historyBand'
        )}
      >
        {body.initial}
        {body.segments.map((segment) => (
          <span key={segment.text} className={segment.className}>
            {segment.text}
          </span>
        ))}{' '}
        {bandCopy.more} {bandCopy.historyExtra}
      </ArticleText>
      <ArticleText title={t('magazine.article.members')}>
        {formatMembers(bandCopy.members)}{' '}
        {t('magazine.article.label', {
          label: trimTrailingPeriod(band.label),
        })}
      </ArticleText>
      <ArticleText title={t('magazine.article.sound')}>
        {bandCopy.sound}
      </ArticleText>
      <ArticleDates entry={entry} isSolo={isSolo} />
    </div>
  );
}
