import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

import { type DecoItem, getDecoLayout } from '../utils/deco-layouts';
import {
  getBookDecoStyle,
  getFootZone,
  getReaderFootDecoStyle,
  getReaderFootRowStyle,
  getReaderSideDecoStyle,
  isFootDecoItem,
} from '../utils/deco-styles';

type DecoPiecesProps = {
  items: readonly DecoItem[];
  getStyle: (item: DecoItem) => CSSProperties;
};

function DecoPieces({ items, getStyle }: DecoPiecesProps) {
  const { t } = useTranslation();

  return items.map((item, index) => (
    <span
      // eslint-disable-next-line @eslint-react/no-array-index-key -- a fixed layout from the design; the same sticker or note can appear twice
      key={index}
      className={'sticker' in item ? `dk dk-${item.sticker}` : 'dn'}
      style={getStyle(item)}
    >
      {'note' in item && t(`magazine.notes.${item.note}`)}
    </span>
  ));
}

type DecoStickersProps = {
  bandIndex: number;
};

export function DecoStickers({ bandIndex }: DecoStickersProps) {
  const { items } = getDecoLayout(bandIndex);

  return (
    <div className="dz" aria-hidden="true">
      <DecoPieces items={items} getStyle={getBookDecoStyle} />
    </div>
  );
}

type ReaderDecoStickersProps = {
  bandIndex: number;
  part: 'side' | 'foot';
};

export function ReaderDecoStickers({
  bandIndex,
  part,
}: ReaderDecoStickersProps) {
  const isFoot = part === 'foot';
  const items = getDecoLayout(bandIndex)
    .items.filter((item) => isFootDecoItem(item) === isFoot)
    .toSorted((first, second) => first.left - second.left);

  if (items.length === 0) return null;

  if (!isFoot) {
    return (
      <div className="mag-reader-deco-side" aria-hidden="true">
        <DecoPieces items={items} getStyle={getReaderSideDecoStyle} />
      </div>
    );
  }

  const zone = getFootZone(items);

  return (
    <div
      className="mag-reader-deco-foot"
      aria-hidden="true"
      style={getReaderFootRowStyle(zone)}
    >
      <DecoPieces
        items={items}
        getStyle={(item) => getReaderFootDecoStyle(item, zone)}
      />
    </div>
  );
}
