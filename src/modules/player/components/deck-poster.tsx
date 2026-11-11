import { StereoDeck } from './stereo-deck';

export function DeckPoster() {
  return (
    <div className="poster kraft mt-[22px] box-content flex flex-wrap items-center justify-center gap-10 overflow-visible px-9 py-10 phone:px-2.5 phone:py-[22px]">
      <span className="tape left-[8%] -rotate-4" aria-hidden="true" />
      <span className="tape right-[8%] rotate-5" aria-hidden="true" />
      <div className="min-w-0 flex-[1_1_100%]">
        <StereoDeck />
      </div>
    </div>
  );
}
