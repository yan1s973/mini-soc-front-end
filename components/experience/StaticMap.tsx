"use client";

import { useEffect, useRef } from "react";
import { buildNameField, heightAt, type Weights } from "@/lib/field";
import { useUI } from "@/lib/store";

/**
 * Repli sans WebGL : la même fonction de hauteur, tracée en courbes de niveau
 * sur un canvas 2D (marching squares). Une carte figée, mais la même carte.
 */
export function StaticMap() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const set = useUI.getState().set;
    set({ ready: true });
    const c = ref.current!;
    const draw = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = window.innerWidth;
      const H = window.innerHeight;
      c.width = W * dpr;
      c.height = H * dpr;
      const ctx = c.getContext("2d")!;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W, H);
      const name = useUI.getState().nameField ?? buildNameField("YANIS", "sans-serif");
      const w: Weights = [1, 1, 0, 0, 0, 0];
      const portrait = W < H;
      const size = portrait ? W * 0.92 : Math.min(W * 0.62, H * 1.1);
      const ox = portrait ? (W - size) / 2 : W - size - W * 0.06;
      const oy = H / 2 - size / 4;
      const N = 220;
      const M = 110;
      const g = new Float32Array((N + 1) * (M + 1));
      for (let j = 0; j <= M; j++)
        for (let i = 0; i <= N; i++) g[j * (N + 1) + i] = heightAt(-1 + (2 * i) / N, -0.5 + j / M, w, 0, 1, name);
      const toX = (i: number) => ox + (i / N) * size;
      const toY = (j: number) => oy + (j / M) * (size / 2);
      for (let lv = 0.012, k = 1; lv < 0.5; lv += 0.012, k++) {
        ctx.beginPath();
        ctx.strokeStyle = k % 5 === 0 ? "rgba(28,36,48,.9)" : "rgba(28,36,48,.42)";
        ctx.lineWidth = k % 5 === 0 ? 1.4 : 0.7;
        for (let j = 0; j < M; j++)
          for (let i = 0; i < N; i++) {
            const a = g[j * (N + 1) + i];
            const b = g[j * (N + 1) + i + 1];
            const cc = g[(j + 1) * (N + 1) + i + 1];
            const d = g[(j + 1) * (N + 1) + i];
            const pts: [number, number][] = [];
            const e = (v0: number, v1: number, x0: number, y0: number, x1: number, y1: number) => {
              if (v0 < lv !== v1 < lv) {
                const t = (lv - v0) / (v1 - v0);
                pts.push([toX(x0 + (x1 - x0) * t), toY(y0 + (y1 - y0) * t)]);
              }
            };
            e(a, b, i, j, i + 1, j);
            e(b, cc, i + 1, j, i + 1, j + 1);
            e(cc, d, i + 1, j + 1, i, j + 1);
            e(d, a, i, j + 1, i, j);
            for (let q = 0; q + 1 < pts.length; q += 2) {
              ctx.moveTo(pts[q][0], pts[q][1]);
              ctx.lineTo(pts[q + 1][0], pts[q + 1][1]);
            }
          }
        ctx.stroke();
      }
    };
    draw();
    const unsub = useUI.subscribe((s, p) => s.nameField !== p.nameField && draw());
    window.addEventListener("resize", draw);
    return () => {
      unsub();
      window.removeEventListener("resize", draw);
    };
  }, []);

  return <canvas ref={ref} className="experience" aria-hidden="true" />;
}
