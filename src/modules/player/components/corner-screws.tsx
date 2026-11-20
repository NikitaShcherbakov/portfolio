const corners = [
  { id: 'top-left', vertical: 'top', horizontal: 'left' },
  { id: 'top-right', vertical: 'top', horizontal: 'right' },
  { id: 'bottom-left', vertical: 'bottom', horizontal: 'left' },
  { id: 'bottom-right', vertical: 'bottom', horizontal: 'right' },
] as const;

type CornerScrewsProps = {
  className: string;
  offset: number;
};

export function CornerScrews({ className, offset }: CornerScrewsProps) {
  return (
    <>
      {corners.map(({ id, vertical, horizontal }) => (
        <span
          key={id}
          className={className}
          aria-hidden="true"
          style={{ [vertical]: offset, [horizontal]: offset }}
        />
      ))}
    </>
  );
}
