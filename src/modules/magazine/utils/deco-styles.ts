import type { CSSProperties } from 'react';

import type { DecoItem, NoteFont } from './deco-layouts';

const noteFonts: Record<NoteFont, string> = {
  Script: "'Bad Script',cursive",
  Marker: "'Permanent Marker',cursive",
};

const footRowTop = 60;
const footRowHeight = 14;
const footRowPaddingTop = 1;
const pageHeightToWidth = 4 / 3;
const bookUnitsPerPage = 50;
const readerSideStickerScale = 2.6;
const readerSideNoteScale = 3.3;

type FootZone = {
  left: number;
  top: number;
  width: number;
};

type ToLength = (size: number) => string;

function formatCssNumber(value: number) {
  return String(Math.round(value * 100) / 100);
}

function toCqw(value: number) {
  return `${String(value)}cqw`;
}

function toReaderLength(value: number) {
  return `calc(${formatCssNumber(value)} * var(--u))`;
}

function toPageUnits(bookUnits: number) {
  return bookUnits * (100 / bookUnitsPerPage);
}

function getRotation({ rotate }: DecoItem) {
  return `rotate(${String(rotate)}deg)`;
}

function getSizeStyle(
  item: DecoItem,
  toStickerWidth: ToLength,
  toNoteSize: ToLength
): CSSProperties {
  return 'sticker' in item
    ? { width: toStickerWidth(item.width) }
    : {
        font: `400 ${toNoteSize(item.size)} ${noteFonts[item.font]}`,
        color: item.color,
      };
}

function getItemRight(item: DecoItem) {
  return 'sticker' in item ? item.left + toPageUnits(item.width) : item.left;
}

export function isFootDecoItem({ top }: DecoItem) {
  return top >= footRowTop;
}

export function getBookDecoStyle(item: DecoItem): CSSProperties {
  return {
    left: `${String(item.left)}%`,
    top: `${String(item.top)}%`,
    transform: getRotation(item),
    ...getSizeStyle(item, toCqw, toCqw),
  };
}

export function getFootZone(items: readonly DecoItem[]): FootZone {
  const left = Math.min(...items.map((item) => item.left));
  const right = Math.max(...items.map(getItemRight));

  return {
    left,
    top: Math.min(...items.map((item) => item.top)) - footRowPaddingTop,
    width: right - left,
  };
}

export function getReaderFootRowStyle({ width }: FootZone): CSSProperties {
  return {
    aspectRatio: `${formatCssNumber(width)} / ${String(footRowHeight)}`,
    maxWidth: toReaderLength(width),
  };
}

export function getReaderFootDecoStyle(
  item: DecoItem,
  zone: FootZone
): CSSProperties {
  const toZoneLength = (pageUnits: number) =>
    `${formatCssNumber((pageUnits / zone.width) * 100)}cqw`;
  const toZoneSize = (bookUnits: number) =>
    toZoneLength(toPageUnits(bookUnits));

  return {
    left: toZoneLength(item.left - zone.left),
    top: toZoneLength((item.top - zone.top) * pageHeightToWidth),
    transform: getRotation(item),
    ...getSizeStyle(item, toZoneSize, toZoneSize),
  };
}

export function getReaderSideDecoStyle(item: DecoItem): CSSProperties {
  return {
    transform: getRotation(item),
    ...getSizeStyle(
      item,
      (width) => toReaderLength(width * readerSideStickerScale),
      (size) => toReaderLength(size * readerSideNoteScale)
    ),
  };
}
