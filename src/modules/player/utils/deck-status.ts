const deckStatuses = {
  Standby: 'standby',
  NoSignal: 'noSignal',
  Loading: 'loading',
  Playing: 'playing',
  Paused: 'paused',
} as const;

type DeckStatus = (typeof deckStatuses)[keyof typeof deckStatuses];

type DeckStatusFlags = {
  isPowerOn: boolean;
  hasPlaybackFailed: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
};

export function getDeckStatus({
  isPowerOn,
  hasPlaybackFailed,
  isPlaying,
  isBuffering,
}: DeckStatusFlags): DeckStatus {
  if (!isPowerOn) return deckStatuses.Standby;
  if (hasPlaybackFailed) return deckStatuses.NoSignal;
  if (!isPlaying) return deckStatuses.Paused;

  return isBuffering ? deckStatuses.Loading : deckStatuses.Playing;
}
