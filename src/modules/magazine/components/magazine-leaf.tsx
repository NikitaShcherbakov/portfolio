import { cn } from '@/lib/utils';

import type { LeafModel, MagazinePage } from '../utils/pages';
import { ArticlePage } from './article-page';
import { CoverPage } from './cover-page';

type LeafFaceProps = {
  side: 'front' | 'back';
  page: MagazinePage | undefined;
  currentLeaf: number;
};

function LeafFace({ side, page, currentLeaf }: LeafFaceProps) {
  return (
    <div className={`face face-${side}`}>
      {page?.kind === 'cover' && (
        <CoverPage entry={page.entry} number={page.number} />
      )}
      {page?.kind === 'article' && (
        <ArticlePage
          entry={page.entry}
          isCurrent={page.entry.leaf === currentLeaf}
        />
      )}
      <div className="shade" aria-hidden="true" />
    </div>
  );
}

type MagazineLeafProps = {
  leaf: LeafModel;
  currentLeaf: number;
  isCurling: boolean;
};

export function MagazineLeaf({
  leaf,
  currentLeaf,
  isCurling,
}: MagazineLeafProps) {
  return (
    <div
      className={cn('leaf', leaf.state, isCurling && 'curl')}
      data-i={leaf.index}
      style={{
        transform: `rotateY(${String(leaf.rotation)}deg)`,
        zIndex: leaf.zIndex,
      }}
    >
      <LeafFace side="front" page={leaf.front} currentLeaf={currentLeaf} />
      <LeafFace side="back" page={leaf.back} currentLeaf={currentLeaf} />
    </div>
  );
}
