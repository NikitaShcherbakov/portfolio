type BookLayerProps = {
  svg: string;
};

export function BookLayer({ svg }: BookLayerProps) {
  return (
    <span
      style={{ display: 'contents' }}
      // eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml -- static SVG files from the design, bundled with ?raw; an <img> renders them differently
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
