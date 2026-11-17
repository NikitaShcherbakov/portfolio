import { clamp } from '@/utils/clamp';

type Point = [number, number];

type FrameStyles = Record<'f' | 'b' | 'us' | 'fs' | 'bs', Keyframe>;

type CurlElements = {
  front: HTMLElement;
  back: HTMLElement;
  under: HTMLElement;
};

const durationMs = 1100;
const frameCount = 66;

function dot(point: Point, normal: Point) {
  return point[0] * normal[0] + point[1] * normal[1];
}

function clipPolygon(
  polygon: Point[],
  normal: Point,
  offset: number,
  isLess: boolean
) {
  const out: Point[] = [];

  polygon.forEach((point, index) => {
    const next = polygon[(index + 1) % polygon.length] ?? point;
    const pointDistance = dot(point, normal) - offset;
    const nextDistance = dot(next, normal) - offset;
    const isPointInside = isLess ? pointDistance <= 0 : pointDistance >= 0;
    const isNextInside = isLess ? nextDistance <= 0 : nextDistance >= 0;

    if (isPointInside) out.push(point);

    if (isPointInside !== isNextInside) {
      const t = pointDistance / (pointDistance - nextDistance);

      out.push([
        point[0] + (next[0] - point[0]) * t,
        point[1] + (next[1] - point[1]) * t,
      ]);
    }
  });

  return out;
}

function toPolygon(points: Point[]) {
  const padded: Point[] = points.length > 0 ? points.slice() : [[0, 0]];

  while (padded.length < 6) {
    padded.push(padded.at(-1) ?? [0, 0]);
  }

  return `polygon(${padded.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})`;
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function createFrameBuilder(width: number, height: number) {
  const diagonal = Math.hypot(width, height);
  const corner: Point = [width, height];
  const rect: Point[] = [
    [0, 0],
    [width, 0],
    [width, height],
    [0, height],
  ];

  const gradient = (
    nx: number,
    ny: number,
    offset: number,
    stops: [string, number][]
  ) => {
    const angle = Math.atan2(nx, -ny);
    const length =
      Math.abs(width * Math.sin(angle)) + Math.abs(height * Math.cos(angle));
    const start = offset - ((width / 2) * nx + (height / 2) * ny) + length / 2;

    return `linear-gradient(${((angle * 180) / Math.PI).toFixed(2)}deg,${stops
      .map(([color, at]) => `${color} ${(start + at).toFixed(1)}px`)
      .join(',')})`;
  };

  return (target: Point): FrameStyles => {
    let point = target;
    let vector: Point = [point[0], point[1] - height];
    let distance = Math.hypot(vector[0], vector[1]);

    if (distance > width) {
      point = [
        (vector[0] / distance) * width,
        height + (vector[1] / distance) * width,
      ];
    }

    vector = [point[0], point[1]];
    distance = Math.hypot(vector[0], vector[1]);

    if (distance > diagonal) {
      point = [
        (vector[0] / distance) * diagonal,
        (vector[1] / distance) * diagonal,
      ];
    }

    const dx = corner[0] - point[0];
    const dy = corner[1] - point[1];
    const length = Math.max(0.6, Math.hypot(dx, dy));
    const nx = dx / length;
    const ny = dy / length;
    const offset =
      ((corner[0] + point[0]) / 2) * nx + ((corner[1] + point[1]) / 2) * ny;
    const front = clipPolygon(rect, [nx, ny], offset, true);
    const cut = clipPolygon(rect, [nx, ny], offset, false);
    const shadowLength = Math.min(width * 0.22, length * 0.6 + 10);
    const sheenLength = Math.max(width * 0.12, length * 0.55);
    const opacity = clamp(
      Math.min(length / (width * 0.14), (2 * width - length) / (width * 0.28)),
      0,
      1
    );
    const matrix = [
      -(1 - 2 * nx * nx),
      2 * nx * ny,
      -2 * nx * ny,
      1 - 2 * ny * ny,
      (1 - 2 * nx * nx) * width + 2 * offset * nx,
      -2 * nx * ny * width + 2 * offset * ny,
    ];

    return {
      f: { clipPath: toPolygon(front) },
      b: {
        clipPath: toPolygon(cut.map(([x, y]) => [width - x, y])),
        transform: `matrix(${matrix.map((value) => value.toFixed(4)).join(',')})`,
      },
      us: {
        clipPath: toPolygon(cut),
        backgroundImage: gradient(nx, ny, offset, [
          ['rgba(0,0,0,.5)', 0],
          ['rgba(0,0,0,0)', shadowLength],
        ]),
        opacity,
      },
      fs: {
        backgroundImage: gradient(-nx, -ny, -offset, [
          ['rgba(0,0,0,.3)', 0],
          ['rgba(0,0,0,0)', width * 0.1],
        ]),
        opacity,
      },
      bs: {
        backgroundImage: gradient(-nx, ny, offset - width * nx, [
          ['rgba(0,0,0,.32)', 0],
          ['rgba(0,0,0,.08)', sheenLength * 0.12],
          ['rgba(255,255,255,.15)', sheenLength * 0.35],
          ['rgba(255,255,255,0)', sheenLength * 0.6],
        ]),
        opacity,
      },
    };
  };
}

function getShade(element: HTMLElement) {
  return element.querySelector<HTMLElement>(':scope > .shade');
}

export function runCurlAnimation(
  isForward: boolean,
  { front, back, under }: CurlElements,
  onFinish: () => void
) {
  const width = front.offsetWidth;
  const height = front.offsetHeight;

  if (!width || !height || typeof front.animate !== 'function') return null;

  const buildFrame = createFrameBuilder(width, height);
  const from: Point = isForward
    ? [width - 1, height - 1]
    : [-width + 0.5, height];
  const to: Point = isForward
    ? [-width + 0.5, height]
    : [width - 0.5, height - 0.5];
  const frames = Array.from({ length: frameCount + 1 }, (_, index) => {
    const k = easeInOutCubic(index / frameCount);

    return buildFrame([
      from[0] + (to[0] - from[0]) * k,
      from[1] + (to[1] - from[1]) * k - Math.sin(Math.PI * k) * height * 0.1,
    ]);
  });
  const keyframes = (key: keyof FrameStyles) =>
    frames.map((frame, index) => ({
      offset: index / frameCount,
      easing: 'step-end',
      ...frame[key],
    }));
  const options: KeyframeAnimationOptions = {
    duration: durationMs,
    fill: 'forwards',
  };
  const frontAnimation = front.animate(keyframes('f'), options);
  const animations = [frontAnimation, back.animate(keyframes('b'), options)];
  const shades: [HTMLElement | null, keyof FrameStyles][] = [
    [getShade(under), 'us'],
    [getShade(front), 'fs'],
    [getShade(back), 'bs'],
  ];

  shades.forEach(([shade, key]) => {
    if (shade) animations.push(shade.animate(keyframes(key), options));
  });

  const resizeObserver = new ResizeObserver(() => {
    if (front.offsetWidth === width && front.offsetHeight === height) return;

    animations.forEach((animation) => {
      animation.finish();
    });
  });

  resizeObserver.observe(front);

  frontAnimation.onfinish = () => {
    resizeObserver.disconnect();
    onFinish();
  };

  return () => {
    resizeObserver.disconnect();
    animations.forEach((animation) => {
      animation.cancel();
    });
  };
}
