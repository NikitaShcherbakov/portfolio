import { memo } from 'react';

import { useCurrentLanguage } from '@/modules/common';

import { getEntryCopy } from '../utils/article';
import { getDecoLayout } from '../utils/deco-layouts';
import type { MagazineEntry } from '../utils/magazine-entries';
import { ArticleBody } from './article-body';
import { ArticleHero } from './article-hero';
import { ArticleNav } from './article-nav';
import { ArticleTools } from './article-tools';
import { DecoStickers, ReaderDecoStickers } from './deco-stickers';
import { ListenButton } from './listen-button';
import { SearchResults } from './search-results';

type ArticlePageProps = {
  entry: MagazineEntry;
  isCurrent: boolean;
  isReader?: boolean;
};

export const ArticlePage = memo(function ArticlePage({
  entry,
  isCurrent,
  isReader = false,
}: ArticlePageProps) {
  const language = useCurrentLanguage();
  const { bandCopy, songCopy } = getEntryCopy(entry, language);
  const bandIndex = entry.leaf - 1;

  return (
    <>
      <div className="k-page">
        <ArticleTools entry={entry} isCurrent={isCurrent} />
        <SearchResults />
        {isReader ? (
          <ReaderDecoStickers bandIndex={bandIndex} part="side" />
        ) : (
          <DecoStickers bandIndex={bandIndex} />
        )}
        <ArticleHero entry={entry} origin={bandCopy.origin} />
        <ArticleBody
          entry={entry}
          bandCopy={bandCopy}
          songCopy={songCopy}
          isLeadMarked={getDecoLayout(bandIndex).isLeadMarked}
        />
        <ListenButton entry={entry}>
          {isReader && <ReaderDecoStickers bandIndex={bandIndex} part="foot" />}
        </ListenButton>
        <ArticleNav entry={entry} />
      </div>
      <div className="aged" aria-hidden="true" />
    </>
  );
});
