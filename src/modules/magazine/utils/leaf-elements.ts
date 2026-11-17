export function findLeaf(book: HTMLElement, index: number) {
  return book.querySelector<HTMLElement>(
    `:scope > .leaf[data-i="${String(index)}"]`
  );
}

export function findFace(leaf: HTMLElement, side: 'front' | 'back') {
  const face = leaf.querySelector<HTMLElement>(`:scope > .face-${side}`);

  if (!face) {
    throw new Error(
      `Magazine leaf ${String(leaf.dataset.i)} has no ${side} face.`
    );
  }

  return face;
}
