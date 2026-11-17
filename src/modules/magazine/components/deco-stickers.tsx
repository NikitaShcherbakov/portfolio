import { useTranslation } from 'react-i18next';

import { getDecoLayout } from '../utils/deco-layouts';

type DecoStickersProps = {
  bandIndex: number;
};

export function DecoStickers({ bandIndex }: DecoStickersProps) {
  const { t } = useTranslation();
  const { items } = getDecoLayout(bandIndex);

  return (
    <div className="dz" aria-hidden="true">
      {items.map((item, index) => (
        <span
          // eslint-disable-next-line @eslint-react/no-array-index-key -- a fixed layout from the design; the same sticker or note can appear twice
          key={index}
          className={'sticker' in item ? `dk dk-${item.sticker}` : 'dn'}
          style={item.style}
        >
          {'note' in item && t(`magazine.notes.${item.note}`)}
        </span>
      ))}
    </div>
  );
}
