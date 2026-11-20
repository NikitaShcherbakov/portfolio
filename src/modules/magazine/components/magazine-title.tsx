import type { CSSProperties } from 'react';

const letterBase: CSSProperties = {
  display: 'inline-block',
  padding: '0 11px',
  margin: '0 4px 6px 0',
  fontWeight: 700,
  lineHeight: 1.15,
  boxShadow: '3px 4px 0 rgba(40,22,8,.3)',
};

const letterStyles: CSSProperties[] = [
  {
    background: '#2c2a28',
    color: '#f1ece2',
    outline: '1px solid rgba(255,255,255,.18)',
    fontFamily: "'Russo One', sans-serif",
    fontSize: 56,
    transform: 'rotate(-3deg)',
  },
  {
    background: '#a3341f',
    color: '#fff',
    fontFamily: "'Oswald', sans-serif",
    fontSize: 60,
    transform: 'rotate(2deg)',
  },
  {
    background: '#efe5cf',
    color: '#1f1a15',
    fontFamily: "'PT Serif', serif",
    fontSize: 54,
    transform: 'rotate(-1deg)',
  },
  {
    background: '#2d6b6e',
    color: '#fff',
    fontFamily: "'Rubik Mono One', sans-serif",
    fontSize: 48,
    transform: 'rotate(3deg)',
  },
  {
    background: '#2c2a28',
    color: '#f1ece2',
    outline: '1px solid rgba(255,255,255,.18)',
    fontFamily: "'Caveat', cursive",
    fontSize: 62,
    transform: 'rotate(-2deg)',
  },
  {
    background: '#d8a536',
    color: '#1f1a15',
    fontFamily: "'Russo One', sans-serif",
    fontSize: 54,
    transform: 'rotate(2deg)',
  },
];

type MagazineTitleProps = {
  children: string;
};

export function MagazineTitle({ children }: MagazineTitleProps) {
  return (
    <h2
      aria-label={children}
      className="mag-title"
      style={{
        margin: 0,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
      }}
    >
      {Array.from(children.toUpperCase(), (letter, index) => (
        <span
          key={index}
          aria-hidden="true"
          style={{
            ...letterBase,
            ...letterStyles[index % letterStyles.length],
          }}
        >
          {letter}
        </span>
      ))}
    </h2>
  );
}
