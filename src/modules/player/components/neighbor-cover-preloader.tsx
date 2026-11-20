import { useNeighborCovers } from '../hooks/use-neighbor-covers';

export function NeighborCoverPreloader() {
  useNeighborCovers();

  return null;
}
