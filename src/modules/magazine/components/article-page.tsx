import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { useCurrentLanguage } from '@/modules/common';
import { formatDuration } from '@/modules/player';

import {
  formatMembers,
  getArticleDates,
  getBody,
  getCity,
  getEntryCopy,
  getHeroImage,
  getNameSize,
  trimTrailingPeriod,
} from '../utils/article';
import { getDecoLayout } from '../utils/deco-layouts';
import type { MagazineEntry } from '../utils/magazine-entries';
import { ArticleNav } from './article-nav';
import { ArticleTools, SearchResults } from './article-tools';
import { DecoStickers } from './deco-stickers';
import { ListenButton } from './listen-button';
import { MagazineImage } from './magazine-image';

type ArticlePageProps = {
  entry: MagazineEntry;
  isCurrent: boolean;
};

export const ArticlePage = memo(function ArticlePage({
  entry,
  isCurrent,
}: ArticlePageProps) {
  const { t } = useTranslation();
  const language = useCurrentLanguage();
  const { band, track } = entry;
  const { bandCopy, songCopy } = getEntryCopy(entry, language);
  const { isPhoto, ...heroImage } = getHeroImage(entry);
  const body = getBody(entry, bandCopy.body);
  const bandIndex = entry.leaf - 1;
  const isSolo = band.kind === 'solo';

  return (
    <>
      <div className="k-page">
        <ArticleTools entry={entry} isCurrent={isCurrent} />
        <SearchResults />
        <DecoStickers bandIndex={bandIndex} />
        <div className="k-hero">
          <div className="duo">
            <MagazineImage
              {...heroImage}
              track={track}
              alt={
                isPhoto
                  ? t('magazine.photo.bandAlt', { name: band.name })
                  : t('magazine.photo.coverAlt', { album: track.album })
              }
              isEager={entry.leaf === 1}
            />
          </div>
          <span className="k-cap" aria-hidden="true">
            {isPhoto
              ? `${band.name}. ${getCity(bandCopy.origin)}, ${String(band.sinceYear)}`
              : `${track.album}, ${String(track.year)}`}
          </span>
          <div className="k-plate">
            <span className="k-kick">
              {t('magazine.article.kicker', {
                origin: bandCopy.origin,
                year: band.sinceYear,
              })}
            </span>
            <h3 className="k-name" style={{ fontSize: getNameSize(band.name) }}>
              {band.name}
            </h3>
          </div>
        </div>
        <div className="k-body">
          <p className="k-lead">
            <span
              className={cn(getDecoLayout(bandIndex).isLeadMarked && 'lk-y')}
            >
              {songCopy.lead}
            </span>
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
          <p className="k-txt">
            <span className="k-h">{t('magazine.article.trackStory')}</span>{' '}
            {songCopy.trackStory}
          </p>
          <div className="k-stats">
            {songCopy.stats.map((stat) => (
              <div key={stat.label} className="k-stat">
                <span className="k-stat-v">{stat.value}</span>
                <span className="k-stat-l">{stat.label}</span>
              </div>
            ))}
          </div>
          <p className="k-txt">
            <span className="k-h">
              {t(
                isSolo
                  ? 'magazine.article.historySolo'
                  : 'magazine.article.historyBand'
              )}
            </span>{' '}
            {body.initial}
            {body.segments.map((segment) => (
              <span key={segment.text} className={segment.className}>
                {segment.text}
              </span>
            ))}{' '}
            {bandCopy.more} {bandCopy.historyExtra}
          </p>
          <p className="k-txt">
            <span className="k-h">{t('magazine.article.members')}</span>{' '}
            {formatMembers(bandCopy.members)}{' '}
            {t('magazine.article.label', {
              label: trimTrailingPeriod(band.label),
            })}
          </p>
          <p className="k-txt">
            <span className="k-h">{t('magazine.article.sound')}</span>{' '}
            {bandCopy.sound}
          </p>
          <p className="k-txt" style={{ textAlign: 'left' }}>
            <span className="k-h">{t('magazine.article.dates')}</span>{' '}
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
          </p>
        </div>
        <ListenButton entry={entry} />
        <ArticleNav entry={entry} />
      </div>
      <div className="aged" aria-hidden="true" />
    </>
  );
});
