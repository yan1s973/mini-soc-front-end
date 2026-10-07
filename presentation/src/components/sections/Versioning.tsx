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
            Chaque version est conservée,{' '}
            <em className="italic">rien n'est perdu</em>
          </>
        }
      >
        Chaque fois qu'un nouveau modèle est mis en service, DataOracle en
        garde une copie complète, à la manière de l'historique des versions
        d'un document. Si une nouvelle version se comporte moins bien que
        prévu, on revient à la précédente en un instant.
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
            <p className="mt-3 text-white/70">
              Trois fichiers par version : la structure du réseau, ce qu'il a
              appris et une fiche d'identité.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-xl bg-black/60 p-4 font-mono text-sm leading-relaxed text-white/80">
{`models/
└── v4/
    ├── model.json     # structure du réseau
    ├── weights.bin    # ce que le réseau a appris
    └── metadata.json  # date, précision,
                       # architecture retenue`}
            </pre>
          </Card>
        </Reveal>
        <Reveal delay={150}>
          <Card className="flex h-full flex-col justify-center md:p-8">
            <RotateCcw className="h-6 w-6 text-lavender" />
            <h3 className="mt-4 font-serif text-3xl text-white">
              Revenir en arrière, sans rien recalculer
            </h3>
            <p className="mt-3 text-white/70">
              Un retour en arrière (rollback) recharge simplement les fichiers
              d'une version précédente. Le modèle retrouve exactement l'état
              qu'il avait, sans nouvel entraînement ni approximation.
            </p>
            <p className="mt-3 text-sm text-white/50">
              Côté technique : une seule requête,{' '}
              <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-sm text-white">
                POST /rollback
              </code>
            </p>
          </Card>
        </Reveal>
      </div>
    </Section>
  )
}
