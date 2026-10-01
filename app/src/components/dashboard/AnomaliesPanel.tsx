import { TriangleAlert } from 'lucide-react'
import type { Anomaly } from '../../data/types'
import { formatPrice, formatTime } from '../../lib'
import { Panel } from './Panel'

export function AnomaliesPanel({ anomalies }: { anomalies: Anomaly[] }) {
  return (
    <Panel id="anomalies" title="Dernières anomalies" icon={TriangleAlert}>
      {anomalies.length === 0 ? (
        <p className="text-sm leading-relaxed text-white/50">
          Aucune anomalie depuis l’ouverture. Une anomalie apparaît quand une
          erreur isolée dépasse μ + 4σ : alerte, mais pas de réentraînement.
        </p>
      ) : (
        <ul className="max-h-[320px] space-y-2 overflow-auto">
          {anomalies.map((anomaly) => (
            <li
              key={anomaly.id}
              className="flex items-center gap-3 rounded-xl border border-rose-400/20 bg-rose-400/5 p-3"
            >
              <TriangleAlert className="h-4 w-4 shrink-0 text-rose-300" />
              <div className="min-w-0 flex-1 text-xs">
                <p className="font-manrope text-sm font-semibold text-white">
                  Erreur de {anomaly.error.toFixed(1)}
                </p>
                <p className="mt-0.5 text-white/50 tabular-nums">
                  {formatTime(anomaly.time)} · prix {formatPrice(anomaly.price)}
                </p>
              </div>
              <span className="text-right text-[11px] text-white/40">
                isolée
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
