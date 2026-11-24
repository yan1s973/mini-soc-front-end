import type { Diagram } from "@/content/projects";

/**
 * Schéma d'architecture au trait — même encre, même grain que la carte.
 * Les nœuds sont posés sur une grille (x 0-12, y 0-8) ; les liens sont des
 * équerres orthogonales, comme un plan de réseau tiré à la règle.
 */
const CX = 64; // pas de grille horizontal (px viewBox)
const CY = 56;
const W = 112; // nœud
const H = 34;

export function ArchDiagram({ d }: { d: Diagram }) {
  const byId = Object.fromEntries(d.nodes.map((n) => [n.id, n]));
  const maxX = Math.max(...d.nodes.map((n) => n.x)) * CX + W / 2 + 16;
  const maxY = Math.max(...d.nodes.map((n) => n.y)) * CY + H / 2 + 24;
  const minX = Math.min(...d.nodes.map((n) => n.x)) * CX - W / 2 - 16;
  const minY = Math.min(...d.nodes.map((n) => n.y)) * CY - H / 2 - 16;

  return (
    <figure className="mt-6 sm:ml-[calc(-11rem-0.75rem)]">
      <svg
        viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
        className="arch block h-auto w-full overflow-visible"
        role="img"
        aria-label={`Schéma d'architecture : ${d.nodes.map((n) => n.label).join(", ")}`}
      >
        <defs>
          <marker id="arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0 L8 4 L0 8" fill="none" stroke="var(--color-ink)" strokeWidth="1" />
          </marker>
        </defs>

        {d.edges.map((e, k) => {
          const a = byId[e.from];
          const b = byId[e.to];
          if (!a || !b) return null;
          const ax = a.x * CX;
          const ay = a.y * CY;
          const bx = b.x * CX;
          const by = b.y * CY;
          // équerre : on sort horizontalement si l'écart horizontal domine
          const horiz = Math.abs(bx - ax) >= Math.abs(by - ay);
          const sx = horiz ? ax + Math.sign(bx - ax) * (W / 2) : ax;
          const sy = horiz ? ay : ay + Math.sign(by - ay) * (H / 2);
          const ex = horiz ? bx - Math.sign(bx - ax || 1) * (W / 2) : bx;
          const ey = horiz ? by : by - Math.sign(by - ay || 1) * (H / 2);
          const mx = (sx + ex) / 2;
          const my = (sy + ey) / 2;
          const path = horiz
            ? `M${sx} ${sy} H${mx} V${ey} H${ex}`
            : `M${sx} ${sy} V${my} H${ex} V${ey}`;
          return (
            <g key={k}>
              <path
                d={path}
                fill="none"
                stroke="var(--color-ink)"
                strokeWidth="1"
                strokeDasharray={e.async ? "4 3" : undefined}
                markerEnd="url(#arrow)"
                className="arch-line"
                style={{ animationDelay: `${300 + k * 90}ms` }}
              />
              {e.label && (
                <text
                  x={horiz ? mx : (sx + ex) / 2}
                  y={horiz ? (sy + ey) / 2 - 5 : my - 5}
                  textAnchor="middle"
                  className="fill-graphite font-mono text-[9px] uppercase tracking-[0.08em]"
                  style={{ paintOrder: "stroke", stroke: "var(--color-paper)", strokeWidth: 4 }}
                >
                  {e.label}
                </text>
              )}
            </g>
          );
        })}

        {d.nodes.map((n, k) => {
          const x = n.x * CX - W / 2;
          const y = n.y * CY - H / 2;
          const kind = n.kind ?? "service";
          return (
            <g key={n.id} className="arch-node" style={{ animationDelay: `${k * 70}ms` }}>
              {kind === "store" ? (
                <>
                  <path
                    d={`M${x} ${y + 5} V${y + H - 5} A${W / 2} 5 0 0 0 ${x + W} ${y + H - 5} V${y + 5}`}
                    fill="var(--color-paper)"
                    stroke="var(--color-ink)"
                  />
                  <ellipse cx={x + W / 2} cy={y + 5} rx={W / 2} ry={5} fill="var(--color-paper)" stroke="var(--color-ink)" />
                </>
              ) : (
                <rect
                  x={x}
                  y={y}
                  width={W}
                  height={H}
                  fill={kind === "edge" ? "var(--color-ink)" : "var(--color-paper)"}
                  stroke="var(--color-ink)"
                  strokeDasharray={kind === "external" ? "3 3" : undefined}
                />
              )}
              <text
                x={n.x * CX}
                y={n.y * CY + (kind === "store" ? 6 : 3.5)}
                textAnchor="middle"
                className={`font-mono text-[10px] uppercase tracking-[0.04em] ${kind === "edge" ? "fill-paper" : "fill-ink"}`}
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="t-mono mt-3 flex flex-wrap gap-x-5 gap-y-1 text-graphite">
        <span>▭ service</span>
        <span>⌭ stockage</span>
        <span>┄ externe</span>
        <span>– – asynchrone</span>
      </figcaption>
    </figure>
  );
}
