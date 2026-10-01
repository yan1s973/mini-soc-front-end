import { Sparkles } from 'lucide-react'
import type { OracleState } from '../../data/types'

function explain(state: OracleState): string {
  const { detectors, points, job, status } = state
  const recent = points.slice(-20)
  const averageError =
    recent.reduce((total, point) => total + point.error, 0) / recent.length
  const lastDeploy = state.logs.find((log) => log.status === 'deployed')

  if (status === 'retraining' && job) {
    const progress = Math.round(
      (job.candidates.reduce((total, c) => total + c.progress, 0) /
        job.candidates.length) *
        100,
    )
    return `Réentraînement en cours (${progress} %) : 4 architectures s’affrontent dans un worker séparé. Pendant ce temps, je continue de prédire normalement avec le modèle v${state.activeVersion}.`
  }
  if (status === 'drift') {
    return 'Les deux méthodes de détection sont d’accord : le marché a changé de comportement. J’ajoute un job de réentraînement à la queue.'
  }
  if (status === 'surveillance') {
    if (detectors.pageHinkley.alarm && !detectors.threshold.alarm) {
      return 'Page-Hinkley signale un changement de moyenne, mais le seuil dynamique ne confirme pas encore. J’attends que les deux méthodes soient d’accord avant d’agir.'
    }
    return `${detectors.threshold.streak} erreur(s) consécutive(s) au-dessus du seuil (μ + 2σ = ${detectors.threshold.limit.toFixed(1)}). Un pic isolé ne suffit pas : j’attends une confirmation.`
  }
  if (lastDeploy && state.now - lastDeploy.time < 15_000) {
    return lastDeploy.type === 'Rollback'
      ? `Rollback effectué : j’utilise de nouveau les poids sauvegardés de v${state.activeVersion}, sans rien recalculer.`
      : `Nouveau modèle v${state.activeVersion} déployé : il a battu l’ancien champion sur le jeu de validation. Les prédictions se recalent sur le marché.`
  }
  return `Le marché évolue normalement. Mon erreur moyenne est de ${averageError.toFixed(1)}, sous le seuil dynamique. Aucune action n’est nécessaire.`
}

export function OraclePanel({ state }: { state: OracleState }) {
  return (
    <section className="rounded-2xl bg-primary-dark/70 p-5">
      <h2 className="flex items-center gap-2 font-manrope text-[15px] font-semibold text-white">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <Sparkles className="h-4 w-4 text-white" />
        </span>
        Oracle AI
      </h2>
      <p className="mt-4 leading-relaxed text-white/90" aria-live="polite">
        {explain(state)}
      </p>
    </section>
  )
}
