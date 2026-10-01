import { LineChart, RefreshCw, RotateCcw, Zap } from 'lucide-react'
import { useState, type MouseEvent } from 'react'
import type { OracleActions } from '../../hooks/useOracle'
import type { OracleState } from '../../data/types'
import { formatPrice, formatTime } from '../../lib'
import { Panel } from './Panel'

const WIDTH = 800
const HEIGHT = 260

type PriceChartProps = {
  state: OracleState
  actions: OracleActions
}

export function PriceChart({ state, actions }: PriceChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const { points } = state

  const values = points.flatMap((point) => [point.price, point.prediction])
  const padding = (Math.max(...values) - Math.min(...values)) * 0.12 || 20
  const lowest = Math.min(...values) - padding
  const highest = Math.max(...values) + padding

  // Positions as percentages so HTML overlays line up with the stretched SVG.
  const xPercent = (i: number) => (i / (points.length - 1)) * 100
  const yPercent = (v: number) => (1 - (v - lowest) / (highest - lowest)) * 100
  const line = (key: 'price' | 'prediction') =>
    points
      .map(
        (point, i) =>
          `${(xPercent(i) / 100) * WIDTH},${(yPercent(point[key]) / 100) * HEIGHT}`,
      )
      .join(' ')

  const ticks = [0.2, 0.5, 0.8].map(
    (ratio) => lowest + (highest - lowest) * ratio,
  )

  const handleMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - rect.left) / rect.width
    const index = Math.round(ratio * (points.length - 1))
    setHoverIndex(Math.min(points.length - 1, Math.max(0, index)))
  }

  const hovered = hoverIndex === null ? null : points[hoverIndex]
  const busy = state.shockLeft > 0 || state.job !== null

  return (
    <Panel
      title="Prix réel vs prédiction"
      icon={LineChart}
      className="flex flex-col xl:col-span-2"
      action={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={actions.shock}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 font-manrope text-xs font-semibold text-white transition-colors hover:bg-[#8d52fd] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Zap className="h-3.5 w-3.5" /> Simuler un choc
          </button>
          <button
            type="button"
            onClick={actions.rollback}
            disabled={state.job !== null}
            className="flex items-center gap-1.5 rounded-lg bg-primary-dark px-3 py-1.5 font-manrope text-xs font-semibold text-[#f6f7f9] transition-colors hover:bg-[#3a3058] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Rollback
          </button>
          <button
            type="button"
            onClick={actions.refresh}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 font-manrope text-xs font-semibold text-white/80 transition-colors hover:bg-white/5"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Actualiser
          </button>
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/60">
          <span className="flex items-center gap-2">
            <span className="h-0.5 w-5 rounded bg-price" /> Prix réel
          </span>
          <span className="flex items-center gap-2">
            <span className="w-5 border-t-2 border-dashed border-forecast" />
            Prédiction IA
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-panel bg-rose-400 ring-1 ring-rose-400" />
            Anomalie
          </span>
        </div>

        <div className="flex min-h-56 flex-1 gap-3 md:min-h-64">
          <div
            className="relative flex-1 cursor-crosshair"
            onMouseMove={handleMove}
            onMouseLeave={() => setHoverIndex(null)}
            role="img"
            aria-label="Graphique temps réel du prix réel et de la prédiction de l’IA"
          >
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              {ticks.map((tick) => (
                <line
                  key={tick}
                  x1={0}
                  x2={WIDTH}
                  y1={(yPercent(tick) / 100) * HEIGHT}
                  y2={(yPercent(tick) / 100) * HEIGHT}
                  stroke="#ffffff"
                  strokeOpacity={0.06}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              <polyline
                points={line('prediction')}
                fill="none"
                stroke="#9a6bff"
                strokeWidth={2}
                strokeDasharray="6 4"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              <polyline
                points={line('price')}
                fill="none"
                stroke="#28a891"
                strokeWidth={2}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {points.map((point, i) =>
              point.anomaly ? (
                <span
                  key={point.time}
                  className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-panel bg-rose-400"
                  style={{
                    left: `${xPercent(i)}%`,
                    top: `${yPercent(point.price)}%`,
                  }}
                />
              ) : null,
            )}

            {hovered && hoverIndex !== null && (
              <>
                <span
                  className="pointer-events-none absolute inset-y-0 w-px bg-white/25"
                  style={{ left: `${xPercent(hoverIndex)}%` }}
                />
                <span
                  className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-panel bg-price"
                  style={{
                    left: `${xPercent(hoverIndex)}%`,
                    top: `${yPercent(hovered.price)}%`,
                  }}
                />
                <span
                  className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-panel bg-forecast"
                  style={{
                    left: `${xPercent(hoverIndex)}%`,
                    top: `${yPercent(hovered.prediction)}%`,
                  }}
                />
                <div
                  className={`pointer-events-none absolute top-2 z-10 w-48 rounded-xl border border-white/10 bg-[#15111f]/95 p-3 text-xs shadow-xl backdrop-blur ${
                    hoverIndex > points.length / 2
                      ? '-translate-x-[calc(100%+12px)]'
                      : 'translate-x-3'
                  }`}
                  style={{ left: `${xPercent(hoverIndex)}%` }}
                >
                  <p className="text-white/50 tabular-nums">
                    {formatTime(hovered.time)}
                  </p>
                  <p className="mt-2 flex justify-between gap-3 text-white/70">
                    <span className="flex items-center gap-1.5">
                      <span className="h-0.5 w-3 bg-price" /> Prix
                    </span>
                    <span className="font-semibold text-white tabular-nums">
                      {formatPrice(hovered.price)}
                    </span>
                  </p>
                  <p className="mt-1 flex justify-between gap-3 text-white/70">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 border-t-2 border-dashed border-forecast" />{' '}
                      Prédiction
                    </span>
                    <span className="font-semibold text-white tabular-nums">
                      {formatPrice(hovered.prediction)}
                    </span>
                  </p>
                  <p className="mt-1 flex justify-between gap-3 text-white/70">
                    <span>Erreur</span>
                    <span className="font-semibold text-white tabular-nums">
                      {hovered.error.toFixed(1)}
                    </span>
                  </p>
                </div>
              </>
            )}
          </div>

          <div
            className="relative w-14 shrink-0 text-right text-[11px] text-white/40 tabular-nums"
            aria-hidden="true"
          >
            {ticks.map((tick) => (
              <span
                key={tick}
                className="absolute right-0 -translate-y-1/2"
                style={{ top: `${yPercent(tick)}%` }}
              >
                {Math.round(tick).toLocaleString('fr-FR')}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-2 flex justify-between pr-[68px] text-[11px] text-white/40 tabular-nums">
          <span>{formatTime(points[0].time)}</span>
          <span>{formatTime(points[points.length - 1].time)}</span>
        </div>
      </div>
    </Panel>
  )
}
