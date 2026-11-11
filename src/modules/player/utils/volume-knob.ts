export const maxVolume = 10;
const knobStartDeg = -135;
const knobSweepDeg = 270;

export function getKnobAngle(volume: number) {
  return knobStartDeg + (volume / maxVolume) * knobSweepDeg;
}

function getDialOffset(unitCoordinate: number) {
  return `${(50 + 50 * unitCoordinate).toFixed(1)}%`;
}

export const dialTicks = Array.from({ length: maxVolume + 1 }, (_, level) => {
  const radians = (getKnobAngle(level) * Math.PI) / 180;

  return {
    level,
    style: {
      left: getDialOffset(Math.sin(radians)),
      top: getDialOffset(-Math.cos(radians)),
    },
  };
});
