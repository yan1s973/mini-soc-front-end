import { Reveal } from '../ui/Reveal'
import { Card, Section, SectionHeader } from '../ui/Section'

type Metric = {
  label: string
  context: string
  // Replace null with the real figure from `npm run analyze-drift`.
  value: string | null
}

const metrics: Metric[] = [
  {
    label: 'Taux de faux positifs',
    context: 'En conditions de marché stables',
    value: null,
  },
  {
    label: 'Délai moyen de détection',
    context: 'Après un choc simulé',
    value: null,
  },
  {
    label: 'Taux d’accord',
    context: 'Entre les deux méthodes de détection',
    value: null,
  },
]

export function Evaluation() {
  return (
    <Section id="evaluation">
      <SectionHeader
        tag="Évaluation quantitative"
        title={
          <>
            Ne pas affirmer que ça marche.{' '}
            <em className="italic">Le mesurer.</em>
          </>
        }
      >
        Chaque point est enregistré avec son statut de détection. Un script
        d'analyse dédié en tire des chiffres concrets sur les performances du
        système.
      </SectionHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {metrics.map((metric, index) => (
          <Reveal key={metric.label} delay={index * 80}>
            <Card className="h-full text-center md:p-8">
              <p className="font-serif text-6xl text-white">
                {metric.value ?? '—'}
              </p>
              <p className="mt-4 font-manrope text-base font-semibold text-white">
                {metric.label}
              </p>
              <p className="mt-1 text-sm text-white/50">{metric.context}</p>
            </Card>
          </Reveal>
        ))}
      </div>

      <Reveal className="mx-auto mt-8 max-w-[560px]">
        <div className="rounded-2xl border border-white/10 bg-black p-5 font-mono text-sm">
          <div className="mb-4 flex gap-1.5" aria-hidden="true">
            <span className="h-3 w-3 rounded-full bg-white/15" />
            <span className="h-3 w-3 rounded-full bg-white/15" />
            <span className="h-3 w-3 rounded-full bg-white/15" />
          </div>
          <p className="text-white">
            <span className="text-lavender">$</span> npm run analyze-drift
          </p>
          <p className="mt-2 text-white/50">
            → faux positifs, délai de détection, accord entre méthodes
          </p>
        </div>
      </Reveal>
    </Section>
  )
}
