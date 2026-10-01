import { HeartPulse } from 'lucide-react'
import type { OracleState } from '../../data/types'
import { Panel } from './Panel'

function Meter({ value, alarm }: { value: number; alarm: boolean }) {
  return (
    <div className="mt-1.5 h-1.5 rounded-full bg-white/5">
      <div
        className={`h-1.5 rounded-full transition-[width] duration-500 ${alarm ? 'bg-rose-400' : 'bg-lavender/60'}`}
        style={{ width: `${Math.min(100, Math.max(2, value * 100))}%` }}
      />
    </div>
  )
}

export function HealthPanel({ state }: { state: OracleState }) {
  const { detectors, points } = state
  const recent = points.slice(-20)
  const averageError =
    recent.reduce((total, point) => total + point.error, 0) / recent.length
  const mape =
    (recent.reduce((total, point) => total + point.error / point.price, 0) /
      recent.length) *
    100
  const score = Math.round(Math.min(100, Math.max(5, 100 - (averageError - 20) * 0.6)))

  const services = [
    { name: 'PostgreSQL', state: 'OK' },
    { name: 'Redis', state: 'OK' },
    { name: 'Worker', state: state.job ? 'Actif' : 'Prêt' },
    { name: 'WebSocket', state: 'OK' },
  ]

  return (
    <Panel id="sante" title="Santé de l’IA" icon={HeartPulse}>
      <div className="flex items-end justify-between">
        <p className="font-serif text-5xl text-white tabular-nums">
          {score}
          <span className="font-inter text-base text-white/40"> / 100</span>
        </p>
        <p className="text-right text-xs text-white/50">
          MAPE <span className="font-semibold text-white tabular-nums">{mape.toFixed(3)} %</span>
        </p>
      </div>

      <div className="mt-5 space-y-3 text-sm">
        <div>
          <p className="flex justify-between text-white/70">
            Seuil dynamique
            <span className="text-white/50 tabular-nums">
              {detectors.threshold.streak}/3 consécutives
            </span>
          </p>
          <Meter value={detectors.threshold.streak / 3} alarm={detectors.threshold.alarm} />
        </div>
        <div>
          <p className="flex justify-between text-white/70">
            Page-Hinkley
            <span className="text-white/50 tabular-nums">
              {detectors.pageHinkley.value.toFixed(0)} / λ {detectors.pageHinkley.lambda}
            </span>
          </p>
          <Meter
            value={detectors.pageHinkley.value / detectors.pageHinkley.lambda}
            alarm={detectors.pageHinkley.alarm}
          />
        </div>
      </div>

      <ul className="mt-5 grid grid-cols-2 gap-2 text-xs">
        {services.map((service) => (
          <li
            key={service.name}
            className="flex items-center justify-between gap-2 rounded-lg bg-black/30 px-2.5 py-2"
          >
            <span className="truncate text-white/70">{service.name}</span>
            <span className="flex items-center gap-1.5 font-semibold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {service.state}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
