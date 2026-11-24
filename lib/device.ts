import type { Tier } from "./store";

export function detectWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!c.getContext("webgl2");
  } catch {
    return false;
  }
}

/** Palier matériel grossier, affiné ensuite par le DPR adaptatif. */
export function detectTier(): Tier {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const mem = nav.deviceMemory ?? 4;
  const coarse = matchMedia("(pointer: coarse)").matches;
  const small = Math.min(screen.width, screen.height) < 600;
  if (cores <= 4 || mem <= 2) return "low";
  if (coarse || small) return "mid";
  return "high";
}

export const TIER = {
  low: { segments: 160, dpr: 1, oct: 4 },
  mid: { segments: 240, dpr: 1.5, oct: 4 },
  high: { segments: 320, dpr: 2, oct: 5 },
} as const;
