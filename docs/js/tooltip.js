import { NUM_CHANNELS, FREQ_START, HISTORY } from "./config.js";
import { els } from "./dom.js";
import { spectrum } from "./spectrum.js";

function channelFromEvent(e, canvas) {
  const r = canvas.getBoundingClientRect();
  return Math.min(NUM_CHANNELS - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * NUM_CHANNELS)));
}

function show(e, lines) {
  els.tooltip.style.display = "block";
  els.tooltip.textContent = lines.join("\n");
  const pad = 14;
  const tw = els.tooltip.offsetWidth;
  const x = e.clientX + pad + tw > window.innerWidth ? e.clientX - pad - tw : e.clientX + pad;
  els.tooltip.style.left = `${x}px`;
  els.tooltip.style.top = `${e.clientY + pad}px`;
}

export function initTooltips() {
  els.bars.addEventListener("mousemove", (e) => {
    const ch = channelFromEvent(e, els.bars);
    const lines = [`${FREQ_START + ch} MHz`];
    if (spectrum.latest) lines.push(`now  : ${spectrum.latest[ch].toFixed(0)} dBm`);
    if (spectrum.sweepCount > 0) lines.push(`peak : ${spectrum.peakHold[ch].toFixed(0)} dBm`);
    show(e, lines);
  });

  els.waterfall.addEventListener("mousemove", (e) => {
    const ch = channelFromEvent(e, els.waterfall);
    const r = els.waterfall.getBoundingClientRect();
    const row = Math.min(HISTORY - 1, Math.max(0, Math.floor(((e.clientY - r.top) / r.height) * HISTORY)));
    const lines = [`${FREQ_START + ch} MHz`, `${row} sweep${row === 1 ? "" : "s"} ago`];
    if (row < spectrum.waterfallRows.length) {
      lines.push(`level : ${spectrum.waterfallRows[row][ch].toFixed(0)} dBm`);
    }
    show(e, lines);
  });

  for (const c of [els.bars, els.waterfall]) {
    c.addEventListener("mouseleave", () => { els.tooltip.style.display = "none"; });
  }
}
