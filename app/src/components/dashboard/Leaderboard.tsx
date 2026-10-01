import { Crown, Trophy } from 'lucide-react'
import type { OracleState } from '../../data/types'
import { Panel } from './Panel'

export function Leaderboard({ state }: { state: OracleState }) {
  const { job, lastJob } = state

  if (job) {
    return (
      <Panel
        id="leaderboard"
        title="Leaderboard AutoML"
        icon={Trophy}
        action={
          <span className="flex items-center gap-1.5 text-xs text-[#c3a6ff]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-forecast" />
            Entraînement en cours
          </span>
        }
      >
        <ul className="space-y-4">
          {job.candidates.map((candidate) => (
            <li key={candidate.name}>
              <p className="flex justify-between text-sm">
                <span className="font-manrope font-semibold text-white">
                  Candidat {candidate.name}
                  <span className="ml-2 font-inter font-normal text-white/50">
                    {candidate.architecture}
                  </span>
                </span>
                <span className="text-white/50 tabular-nums">
                  {Math.round(candidate.progress * 100)} %
                </span>
              </p>
              <div className="mt-1.5 h-1.5 rounded-full bg-white/5">
                <div
                  className="h-1.5 rounded-full bg-forecast transition-[width] duration-700"
                  style={{ width: `${Math.max(2, candidate.progress * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-white/40">
          Le service continue de prédire pendant l’entraînement.
        </p>
      </Panel>
    )
  }

  if (!lastJob) {
    return (
      <Panel id="leaderboard" title="Leaderboard AutoML" icon={Trophy}>
        <p className="text-sm text-white/50">
          Aucun réentraînement pour l’instant. Simulez un choc pour lancer une
          compétition.
        </p>
      </Panel>
    )
  }

  const ranked = [...lastJob.candidates].sort(
    (a, b) => (a.valError ?? Infinity) - (b.valError ?? Infinity),
  )
  const worst = Math.max(...ranked.map((c) => c.valError ?? 0))

  return (
    <Panel
      id="leaderboard"
      title="Leaderboard AutoML"
      icon={Trophy}
      action={<span className="text-xs text-white/40">Erreur de validation</span>}
    >
      <ol className="space-y-4">
        {ranked.map((candidate, index) => {
          const isChallenger = candidate.name === lastJob.challenger.name
          return (
            <li key={candidate.name}>
              <p className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate font-manrope font-semibold text-white">
                  <span className="mr-2 text-white/40 tabular-nums">{index + 1}.</span>
                  {candidate.name}
                  <span className="ml-2 font-inter font-normal text-white/50">
                    {candidate.architecture}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {isChallenger && (
                    <span className="rounded-md bg-primary px-1.5 py-0.5 font-cabin text-[11px] text-white">
                      Challenger
                    </span>
                  )}
                  <span className="text-white tabular-nums">{candidate.valError}</span>
                </span>
              </p>
              <div className="mt-1.5 h-1.5 rounded-full bg-white/5">
                <div
                  className={`h-1.5 rounded-full ${isChallenger ? 'bg-forecast' : 'bg-white/20'}`}
                  style={{ width: `${((candidate.valError ?? 0) / worst) * 100}%` }}
                />
              </div>
            </li>
          )
        })}
      </ol>
      <div className="mt-5 flex items-start gap-2 rounded-xl bg-black/30 p-3 text-xs text-white/70">
        <Crown className="mt-0.5 h-4 w-4 shrink-0 text-lavender" />
        <p>
          Champion évalué à{' '}
          <span className="font-semibold text-white tabular-nums">{lastJob.championError}</span>{' '}
          sur le même jeu de validation.{' '}
          {lastJob.deployed
            ? `Le challenger ${lastJob.challenger.name} gagne et devient champion.`
            : 'Le champion est conservé.'}
        </p>
      </div>
    </Panel>
  )
}
