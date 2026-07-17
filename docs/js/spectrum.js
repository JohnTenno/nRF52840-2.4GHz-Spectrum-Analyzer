import { NUM_CHANNELS, HISTORY, DBM_MIN, OCC_THRESHOLD } from "./config.js";

export const spectrum = {
  waterfallRows: [],
  rowTimes: [],
  latest: null,
  peakHold: new Float32Array(NUM_CHANNELS).fill(DBM_MIN),
  sweepCount: 0,
  sweepTimes: [],
  paused: false,
};

export function parseSweepLine(line) {
  if (!line) return null;
  const parts = line.split(",");
  if (parts.length !== NUM_CHANNELS) return null;
  const values = new Float32Array(NUM_CHANNELS);
  for (let i = 0; i < NUM_CHANNELS; i++) {
    const v = Number(parts[i]);
    if (Number.isNaN(v)) return null;
    values[i] = v;
  }
  return values;
}

export function addSweep(values) {
  spectrum.latest = values;
  for (let i = 0; i < NUM_CHANNELS; i++) {
    if (values[i] > spectrum.peakHold[i]) spectrum.peakHold[i] = values[i];
  }
  spectrum.waterfallRows.unshift(values);
  spectrum.rowTimes.unshift(performance.now());
  if (spectrum.waterfallRows.length > HISTORY) {
    spectrum.waterfallRows.pop();
    spectrum.rowTimes.pop();
  }
  spectrum.sweepCount++;
  const now = performance.now();
  spectrum.sweepTimes.push(now);
  while (spectrum.sweepTimes.length && now - spectrum.sweepTimes[0] > 5000) {
    spectrum.sweepTimes.shift();
  }
}

export function computeStats(values) {
  let maxV = -Infinity, maxI = 0, occ = 0;
  for (let i = 0; i < NUM_CHANNELS; i++) {
    if (values[i] > maxV) { maxV = values[i]; maxI = i; }
    if (values[i] > OCC_THRESHOLD) occ++;
  }
  const t = spectrum.sweepTimes;
  const rate = t.length > 1 ? (t.length - 1) / ((t[t.length - 1] - t[0]) / 1000) : null;
  return { maxV, maxI, occPct: (occ / NUM_CHANNELS) * 100, rate };
}

export function resetPeak() {
  spectrum.peakHold = new Float32Array(NUM_CHANNELS).fill(DBM_MIN);
}
