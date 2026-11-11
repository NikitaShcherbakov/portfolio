import { CornerScrews } from './corner-screws';
import { DeckHeader } from './deck-header';
import { DeckJacks } from './deck-jacks';
import { DeckPlaylist } from './deck-playlist';
import { DeckScreen } from './deck-screen';
import { DeckShell } from './deck-shell';
import { DeckTime } from './deck-time';
import { DeckTransport } from './deck-transport';
import { DeckVolume } from './deck-volume';
import { DiscBay } from './disc-bay';
import { NeighborCoverPreloader } from './neighbor-cover-preloader';

export function StereoDeck() {
  return (
    <DeckShell>
      <NeighborCoverPreloader />
      <CornerScrews className="screw" offset={12} />
      <DeckHeader />
      <div className="deck-grid">
        <div className="deck-mid">
          <div className="hp">
            <CornerScrews className="hp-screw" offset={8} />
            <DeckScreen />
            <div className="hp-lower">
              <DeckTransport />
              <div className="hp-row2">
                <DeckVolume />
                <DeckTime />
              </div>
            </div>
            <DeckJacks />
          </div>
        </div>
        <DiscBay />
      </div>
      <DeckPlaylist />
    </DeckShell>
  );
}
