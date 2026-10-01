import { Bell, Search } from 'lucide-react'
import { formatTime } from '../../lib'

type TopBarProps = {
  now: number
  query: string
  onQueryChange: (query: string) => void
  anomalyCount: number
}

export function TopBar({ now, query, onQueryChange, anomalyCount }: TopBarProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-white/[0.08] px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
      <div>
        <h1 className="font-manrope text-xl font-semibold text-white md:text-2xl">
          Vue d’ensemble
        </h1>
        <p className="mt-0.5 text-sm text-white/50">
          BTC/USD · mis à jour à{' '}
          <span className="tabular-nums">{formatTime(now)}</span>
        </p>
      </div>

      <div className="flex items-center gap-2">
        <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 md:w-72 md:flex-none">
          <Search className="h-4 w-4 shrink-0 text-white/40" />
          <span className="sr-only">Rechercher dans l’activité</span>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Rechercher dans l’activité…"
            className="w-full min-w-0 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
          />
        </label>
        <a
          href="#anomalies"
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/70 transition-colors hover:text-white"
          aria-label={`${anomalyCount} anomalie(s) récente(s)`}
        >
          <Bell className="h-4 w-4" />
          {anomalyCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
              {anomalyCount}
            </span>
          )}
        </a>
        <span className="hidden h-10 items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 font-manrope text-xs font-semibold text-emerald-300 sm:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          ONLINE
        </span>
      </div>
    </div>
  )
}
