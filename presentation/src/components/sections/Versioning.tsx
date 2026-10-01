import { RotateCcw } from 'lucide-react'
import { Reveal } from '../ui/Reveal'
import { Card, Section, SectionHeader } from '../ui/Section'

const versions = ['v1', 'v2', 'v3', 'v4']

export function Versioning() {
  return (
    <Section id="versions" className="bg-surface/60">
      <SectionHeader
        tag="Versionnement"
        title={
          <>
            Des versions <em className="italic">réelles</em>, pas symboliques
          </>
        }
      >
        Chaque déploiement crée une vraie version sur disque : les poids du
        réseau et ses métadonnées.
      </SectionHeader>

      <Reveal>
        <div className="relative mx-auto flex max-w-[760px] items-center justify-between">
          <div
            className="absolute top-1/2 right-0 left-0 h-px bg-primary/60"
            aria-hidden="true"
          />
          {versions.map((version, index) => {
            const isActive = index === versions.length - 1
            return (
              <span
                key={version}
                className={`relative flex h-14 w-14 items-center justify-center rounded-full font-cabin text-base font-medium md:h-16 md:w-16 ${
                  isActive
                    ? 'bg-primary text-white shadow-[0_0_32px_rgba(123,57,252,0.6)]'
                    : 'border border-primary/60 bg-black text-white/80'
                }`}
              >
                {version}
              </span>
            )
          })}
        </div>
      </Reveal>

      <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Reveal>
          <Card className="h-full md:p-8">
            <p className="font-cabin text-sm font-medium text-lavender">
              Ce qui est sauvegardé
            </p>
            <pre className="mt-4 overflow-x-auto rounded-xl bg-black/60 p-4 font-mono text-sm leading-relaxed text-white/80">
{`models/
└── v4/
    ├── model.json     # architecture
    ├── weights.bin    # poids du réseau
    └── metadata.json  # date, erreur au switch,
                       # architecture gagnante`}
            </pre>
          </Card>
        </Reveal>
        <Reveal delay={150}>
          <Card className="flex h-full flex-col justify-center md:p-8">
            <RotateCcw className="h-6 w-6 text-lavender" />
            <h3 className="mt-4 font-serif text-3xl text-white">
              Un rollback qui ne recalcule rien
            </h3>
            <p className="mt-3 text-white/70">
              <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-sm text-white">
                POST /rollback
              </code>{' '}
              recharge littéralement les poids sauvegardés d'une version
              antérieure précise. Pas de réentraînement, pas
              d'approximation.
            </p>
          </Card>
        </Reveal>
      </div>
    </Section>
  )
}
