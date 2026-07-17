import { DBM_MIN, DBM_MAX } from "./config.js";

const INFERNO = [
  [0, 0, 4], [40, 11, 84], [101, 21, 110], [159, 42, 99],
  [212, 72, 66], [245, 125, 21], [250, 193, 39], [252, 255, 164],
];

export function infernoRGB(dbm) {
  const t = Math.min(1, Math.max(0, (dbm - DBM_MIN) / (DBM_MAX - DBM_MIN)));
  const pos = t * (INFERNO.length - 1);
  const i = Math.min(INFERNO.length - 2, Math.floor(pos));
  const f = pos - i;
  const a = INFERNO[i], b = INFERNO[i + 1];
  return [
    Math.round(a[0] + (b[0] - a[0]) * f),
    Math.round(a[1] + (b[1] - a[1]) * f),
    Math.round(a[2] + (b[2] - a[2]) * f),
  ];
}

export function infernoCSS(dbm) {
  const [r, g, b] = infernoRGB(dbm);
  return `rgb(${r},${g},${b})`;
}
