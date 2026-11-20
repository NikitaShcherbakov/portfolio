import { cn } from '@/lib/utils';

import { getCutoutWords } from '../utils/get-cutout-words';

const letterStyles = [
  'rotate-[-3deg] bg-ink font-russo text-[54px]/[1.15] text-paper outline outline-white/18 phone:text-[38px]/[1.15]',
  'rotate-[1deg] bg-flag-blue font-russo text-[60px]/[1.15] text-white phone:text-[42px]/[1.15]',
  'rotate-[-2deg] bg-ink font-caveat text-[54px]/[1.15] text-paper outline outline-white/18 phone:text-[38px]/[1.15]',
  'rotate-[3deg] bg-marker-yellow font-pt-serif text-[60px]/[1.15] text-coal phone:text-[42px]/[1.15]',
  'rotate-[-1deg] bg-flag-red font-oswald text-[54px]/[1.15] text-white phone:text-[38px]/[1.15]',
  'rotate-[2deg] bg-paper font-rubik-mono text-[60px]/[1.15] text-coal phone:text-[42px]/[1.15]',
];

type CutoutHeadingProps = {
  children: string;
  id?: string;
};

export function CutoutHeading({ children, id }: CutoutHeadingProps) {
  return (
    <h2 id={id} className="m-0 flex flex-wrap items-end gap-x-4">
      <span className="sr-only">{children}</span>
      {getCutoutWords(children).map(({ startIndex, letters }) => (
        <span
          key={startIndex}
          aria-hidden="true"
          className="inline-flex flex-nowrap items-end"
        >
          {letters.map(({ letter, index }) => (
            <span
              key={index}
              className={cn(
                'mr-[3px] mb-1.5 inline-block px-2.5 font-bold uppercase shadow-cutout phone:px-1.5',
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
