import type { DriftStatus, LogStatus } from '../../data/types'

const driftStyles: Record<DriftStatus, { label: string; dot: string; text: string }> = {
  stable: { label: 'Stable', dot: 'bg-emerald-400', text: 'text-emerald-300' },
  surveillance: { label: 'Surveillance', dot: 'bg-amber-400', text: 'text-amber-300' },
  drift: { label: 'Drift détecté', dot: 'bg-rose-500', text: 'text-rose-300' },
  retraining: { label: 'Réentraînement', dot: 'bg-forecast', text: 'text-[#c3a6ff]' },
}

export function DriftBadge({ status }: { status: DriftStatus }) {
  const style = driftStyles[status]
  return (
    <span className={`inline-flex items-center gap-2 font-manrope font-semibold ${style.text}`}>
      <span
        className={`h-2 w-2 rounded-full ${style.dot} ${status === 'stable' ? '' : 'animate-pulse'}`}
      />
      {style.label}
    </span>
  )
}

const logStyles: Record<LogStatus, { label: string; className: string }> = {
  processed: {
    label: 'Traité',
    className: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  },
  queued: {
    label: 'En file',
    className: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  },
  alert: {
    label: 'Alerte',
    className: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
  },
  deployed: {
    label: 'Déployé',
    className: 'border-forecast/40 bg-forecast/15 text-[#c3a6ff]',
  },
  info: {
    label: 'Info',
    className: 'border-white/15 bg-white/5 text-white/70',
  },
}

export function LogBadge({ status }: { status: LogStatus }) {
  const style = logStyles[status]
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 font-cabin text-xs font-medium whitespace-nowrap ${style.className}`}
    >
      {style.label}
    </span>
  )
}
