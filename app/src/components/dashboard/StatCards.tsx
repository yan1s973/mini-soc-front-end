import {
  Activity,
  Bot,
  Gauge,
  Package,
  RefreshCw,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import type { OracleState } from '../../data/types'
import { formatPrice } from '../../lib'
import { DriftBadge } from './badges'

type StatProps = {
  icon: LucideIcon
  label: string
  value: ReactNode
  hint: string
  compact?: boolean
}

function Stat({ icon: Icon, label, value, hint, compact = false }: StatProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] p-4">
      <p className="flex items-center gap-2 text-xs text-white/50">
        <Icon className="h-3.5 w-3.5 text-lavender" />
        {label}
      </p>
      <div
        className={`mt-2 truncate font-manrope font-semibold text-white tabular-nums ${
          compact ? 'text-sm leading-7' : 'text-lg md:text-xl'
        }`}
      >
        {value}
      </div>
      <p className="mt-1 truncate text-xs text-white/40">{hint}</p>
    </div>
  )
}

export function StatCards({ state }: { state: OracleState }) {
  const { points, detectors } = state
  const current = points[points.length - 1]
  const minuteAgo = points[0]
  const change = current.price - minuteAgo.price
  const recent = points.slice(-20)
  const averageError =
    recent.reduce((total, point) => total + point.error, 0) / recent.length
  const methodsInAlarm =
    Number(detectors.threshold.alarm) + Number(detectors.pageHinkley.alarm)

  return (
    <div id="vue-ensemble" className="grid scroll-mt-6 grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <Stat
        icon={TrendingUp}
        label="Prix actuel"
        value={formatPrice(current.price)}
        hint={`${change >= 0 ? '+' : ''}${change.toFixed(0)} $ sur 1 min`}
      />
      <Stat
        icon={Bot}
        label="Prédiction IA"
        value={formatPrice(current.prediction)}
        hint="Sur les 10 dernières valeurs"
      />
      <Stat
        icon={Activity}
        label="Erreur"
        value={current.error.toFixed(1)}
        hint={`Moyenne : ${averageError.toFixed(1)}`}
      />
      <Stat
        icon={Gauge}
        label="Drift"
        value={<DriftBadge status={state.status} />}
        hint={`${methodsInAlarm}/2 détecteurs`}
        compact
      />
      <Stat
        icon={RefreshCw}
        label="Réentraînements"
        value={state.retrains}
        hint={state.job ? 'Job en cours' : 'Aucun job en cours'}
      />
      <Stat
        icon={Package}
        label="Modèle actif"
        value={`v${state.activeVersion}`}
        hint={`${state.versions.length} versions sur disque`}
      />
    </div>
  )
}
