import { cn } from '@/lib/utils';

const letterStyles = [
  'rotate-[-3deg] bg-[#2c2a28] font-russo text-[54px]/[1.15] text-[#f1ece2] outline outline-white/18 phone:text-[38px]/[1.15]',
  'rotate-[1deg] bg-[#2a52a8] font-russo text-[60px]/[1.15] text-white phone:text-[42px]/[1.15]',
  'rotate-[-2deg] bg-[#2c2a28] font-caveat text-[54px]/[1.15] text-[#f1ece2] outline outline-white/18 phone:text-[38px]/[1.15]',
  'rotate-[3deg] bg-[#f2c230] font-pt-serif text-[60px]/[1.15] text-[#111] phone:text-[42px]/[1.15]',
  'rotate-[-1deg] bg-[#b3121b] font-oswald text-[54px]/[1.15] text-white phone:text-[38px]/[1.15]',
  'rotate-[2deg] bg-[#f1ece2] font-rubik-mono text-[60px]/[1.15] text-[#111] phone:text-[42px]/[1.15]',
];

type CutoutHeadingProps = {
  children: string;
};

function getWords(text: string) {
  let letterIndex = 0;

  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      Array.from(word, (letter) => ({ letter, index: letterIndex++ }))
    );
}

export function CutoutHeading({ children }: CutoutHeadingProps) {
  return (
    <h2 className="m-0 flex flex-wrap items-end gap-x-4">
      <span className="sr-only">{children}</span>
      {getWords(children).map((letters) => (
        <span
          key={letters[0]?.index}
          aria-hidden="true"
          className="inline-flex flex-nowrap items-end"
        >
          {letters.map(({ letter, index }) => (
            <span
              key={index}
              className={cn(
                'mr-[3px] mb-1.5 inline-block px-2.5 font-bold uppercase shadow-[3px_4px_0_rgba(40,22,8,0.3)] phone:px-1.5',
                letterStyles[index % letterStyles.length]
              )}
            >
              {letter}
            </span>
          ))}
        </span>
      ))}
    </h2>
  );
}
