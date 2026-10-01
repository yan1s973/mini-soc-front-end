import { ScrollText } from 'lucide-react'
import type { LogEntry } from '../../data/types'
import { formatTime } from '../../lib'
import { LogBadge } from './badges'
import { Panel } from './Panel'

type ActivityTableProps = {
  logs: LogEntry[]
  query: string
}

export function ActivityTable({ logs, query }: ActivityTableProps) {
  const needle = query.trim().toLowerCase()
  const visible = needle
    ? logs.filter((log) =>
        [log.source, log.type, log.details].some((field) =>
          field.toLowerCase().includes(needle),
        ),
      )
    : logs

  return (
    <Panel
      id="activite"
      title="Journal d’activité"
      icon={ScrollText}
      action={
        <span className="text-xs text-white/40 tabular-nums">
          {visible.length} événement{visible.length > 1 ? 's' : ''}
        </span>
      }
    >
      <div className="max-h-[360px] overflow-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="sticky top-0 bg-panel text-xs text-white/40">
            <tr>
              <th className="py-2 pr-4 font-medium">Horodatage</th>
              <th className="py-2 pr-4 font-medium">Statut</th>
              <th className="py-2 pr-4 font-medium">Source</th>
              <th className="py-2 pr-4 font-medium">Type</th>
              <th className="py-2 font-medium">Détails</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((log) => (
              <tr key={log.id} className="border-t border-white/[0.05]">
                <td className="py-2.5 pr-4 whitespace-nowrap text-white/60 tabular-nums">
                  {formatTime(log.time)}
                </td>
                <td className="py-2.5 pr-4">
                  <LogBadge status={log.status} />
                </td>
                <td className="py-2.5 pr-4 whitespace-nowrap text-white">
                  {log.source}
                </td>
                <td className="py-2.5 pr-4 whitespace-nowrap text-white/60">
                  {log.type}
                </td>
                <td className="py-2.5 text-white/80">{log.details}</td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-white/40">
                  Aucun événement ne correspond à « {query} ».
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
