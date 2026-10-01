import { Package } from 'lucide-react'
import type { OracleState } from '../../data/types'
import { formatDateTime } from '../../lib'
import { Panel } from './Panel'

export function VersionsPanel({ state }: { state: OracleState }) {
  const versions = [...state.versions].sort((a, b) => b.version - a.version)

  return (
    <Panel
      id="modeles"
      title="Versions des modèles"
      icon={Package}
      action={<span className="text-xs text-white/40">models/ sur disque</span>}
    >
      <ul className="max-h-[320px] space-y-2 overflow-auto">
        {versions.map((version) => {
          const isActive = version.version === state.activeVersion
          return (
            <li
              key={version.version}
              className={`flex items-center gap-3 rounded-xl border p-3 ${
                isActive
                  ? 'border-forecast/50 bg-forecast/10'
                  : 'border-white/[0.06] bg-black/20'
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-cabin text-sm font-medium ${
                  isActive ? 'bg-primary text-white' : 'border border-white/15 text-white/70'
                }`}
              >
                v{version.version}
              </span>
              <div className="min-w-0 flex-1 text-xs">
                <p className="truncate font-manrope text-sm font-semibold text-white">
                  {version.architecture}
                </p>
                <p className="mt-0.5 text-white/50 tabular-nums">
                  {formatDateTime(version.deployedAt)}
                  {version.errorAtSwitch !== null &&
                    ` · erreur au switch ${version.errorAtSwitch}`}
                </p>
              </div>
              {isActive && (
                <span className="rounded-md bg-primary px-1.5 py-0.5 font-cabin text-[11px] text-white">
                  Actif
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
