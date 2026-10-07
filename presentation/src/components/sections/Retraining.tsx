import { Crown, Swords } from 'lucide-react'
import { Reveal } from '../ui/Reveal'
import { Card, Section, SectionHeader } from '../ui/Section'

const pipeline = [
  'Une dérive est confirmée par les deux méthodes',
  'La demande est placée dans une file d’attente (Redis / BullMQ)',
  'Un worker dédié entraîne quatre architectures candidates',
  'Chaque candidat est évalué sur des données qu’il n’a jamais vues',
  'Le meilleur candidat devient le « challenger »',
  'Il est comparé au modèle en service, le « champion »',
  'Le plus performant des deux reste en production',
  'La version retenue est enregistrée sur disque',
]

type Candidate = {
  name: string
  layers: string
  activation: string
  // Relative validation error, for illustration only (lower is better).
  error: number
}

const candidates: Candidate[] = [
  { name: 'A', layers: '1 couche × 16', activation: 'ReLU', error: 82 },
  { name: 'B', layers: '2 couches × 32', activation: 'ReLU', error: 46 },
  { name: 'C', layers: '2 couches × 64', activation: 'tanh', error: 61 },
  { name: 'D', layers: '3 couches × 64', activation: 'ELU', error: 70 },
]

const bestError = Math.min(...candidates.map((candidate) => candidate.error))

export function Retraining() {
  return (
    <Section id="reentrainement">
      <SectionHeader
        tag="Réentraînement"
        title={
          <>
            Le meilleur modèle, <em className="italic">pas le plus récent</em>
          </>
        }
      >
        Lorsqu'une dérive est confirmée, DataOracle n'entraîne pas un modèle
        unique au hasard. Il met plusieurs architectures en concurrence
        (AutoML) et ne remplace le modèle en service que si le nouveau obtient
        de meilleurs résultats : c'est le principe champion / challenger.
      </SectionHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Reveal>
          <Card className="h-full md:p-8">
            <ol className="flex flex-col gap-5">
              {pipeline.map((step, index) => (
                <li key={step} className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-dark font-cabin text-xs font-medium text-white ring-1 ring-primary/60">
                    {index + 1}
                  </span>
                  <span className="pt-0.5 text-white/80">{step}</span>
                </li>
              ))}
            </ol>
          </Card>
        </Reveal>

        <div className="flex flex-col gap-4">
          <Reveal delay={150}>
            <Card className="md:p-8">
              <div className="flex items-center justify-between">
                <p className="font-cabin text-sm font-medium text-lavender">
                  Leaderboard des candidats
                </p>
                <span className="font-cabin text-xs text-white/40">
                  Exemple illustratif
                </span>
              </div>
              <ul className="mt-6 flex flex-col gap-4">
                {candidates.map((candidate) => {
                  const isBest = candidate.error === bestError
                  return (
                    <li key={candidate.name}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-manrope font-semibold text-white">
                          Candidat {candidate.name}
                          <span className="ml-2 font-inter font-normal text-white/50">
                            {candidate.layers} · {candidate.activation}
                          </span>
                        </span>
                        {isBest && (
                          <span className="rounded-md bg-primary px-2 py-0.5 font-cabin text-xs text-white">
                            Challenger
                          </span>
                        )}
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-white/5">
                        <div
                          className={`h-2 rounded-full ${isBest ? 'bg-primary' : 'bg-lavender/40'}`}
                          style={{ width: `${candidate.error}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
              <p className="mt-4 text-xs text-white/40">
                Barre plus courte = erreur de validation plus faible.
              </p>
            </Card>
          </Reveal>

          <Reveal delay={250}>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-[rgba(164,132,215,0.3)] bg-primary-dark/60 p-6">
              <div className="text-center">
                <Swords className="mx-auto h-6 w-6 text-lavender" />
                <p className="mt-2 font-manrope text-sm font-semibold text-white">
                  Challenger
                </p>
                <p className="text-xs text-white/50">meilleur candidat</p>
              </div>
              <span className="font-serif text-2xl text-white/60 italic">vs</span>
              <div className="text-center">
                <Crown className="mx-auto h-6 w-6 text-lavender" />
                <p className="mt-2 font-manrope text-sm font-semibold text-white">
                  Champion
                </p>
                <p className="text-xs text-white/50">modèle actif</p>
              </div>
              <p className="col-span-3 mt-2 text-center text-sm text-white/70">
                Les deux modèles sont évalués sur les mêmes données, jamais
                vues pendant l'entraînement. Le plus précis l'emporte.
              </p>
            </div>
          </Reveal>
        </div>
      </div>

      <Reveal className="mt-4">
        <Card className="text-center md:p-8">
          <p className="font-serif text-2xl leading-snug text-white md:text-3xl">
            Le service reste disponible{' '}
            <em className="italic">pendant le réentraînement</em>.
          </p>
          <p className="mx-auto mt-3 max-w-[640px] text-white/70">
            Entraîner de nouveaux modèles demande beaucoup de calcul. Plutôt
            que de ralentir le serveur principal, DataOracle confie cette tâche
            à un programme séparé, appelé worker, par l'intermédiaire d'une
            file d'attente Redis. Les prédictions et le dashboard continuent de
            fonctionner normalement, puis le serveur charge le nouveau modèle
            dès que l'entraînement est terminé, sans interruption.
          </p>
        </Card>
      </Reveal>
    </Section>
  )
}
