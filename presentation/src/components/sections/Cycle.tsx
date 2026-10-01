import { Zap } from 'lucide-react'
import { Reveal } from '../ui/Reveal'
import { Section, SectionHeader } from '../ui/Section'

type Step = {
  title: string
  detail: string
}

const steps: Step[] = [
  { title: 'Nouvelle donnée', detail: 'Prix Bitcoin réel, CoinGecko' },
  { title: "L'IA prédit", detail: 'Réseau TensorFlow.js' },
  { title: 'La vraie valeur arrive', detail: 'Le marché répond' },
  { title: 'On compare', detail: 'Prédiction contre réalité' },
  { title: 'Erreur calculée', detail: 'Écart mesuré' },
  { title: 'Double détection', detail: 'Deux méthodes en parallèle' },
  { title: 'Sauvegarde', detail: 'PostgreSQL et log d’analyse' },
]

export function Cycle() {
  return (
    <Section id="fonctionnement" className="bg-surface/60">
      <SectionHeader
        tag="Le cycle temps réel"
        title={
          <>
            Chaque seconde, <em className="italic">la même boucle</em>
          </>
        }
      >
        Le prix du Bitcoin est rafraîchi toutes les 10 secondes depuis
        CoinGecko. Redis conserve la dernière valeur connue si l'API tombe. Le
        cycle ci-dessous se répète en permanence.
      </SectionHeader>

      <ol className="relative grid gap-4 md:grid-cols-7 md:gap-3">
        <div
          className="absolute top-5 right-[7%] left-[7%] hidden h-px bg-gradient-to-r from-primary/0 via-primary to-primary/0 md:block"
          aria-hidden="true"
        />
        {steps.map((step, index) => (
          <Reveal key={step.title} delay={index * 80}>
            <li className="relative flex items-center gap-4 md:flex-col md:text-center">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary bg-black font-cabin text-sm font-medium text-white">
                {index + 1}
              </span>
              <div>
                <p className="font-manrope text-sm font-semibold text-white">
                  {step.title}
                </p>
                <p className="mt-1 text-sm text-white/50">{step.detail}</p>
              </div>
            </li>
          </Reveal>
        ))}
      </ol>

      <Reveal className="mx-auto mt-16 max-w-[720px]">
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-[rgba(164,132,215,0.3)] bg-primary-dark/60 p-6 sm:flex-row sm:items-center">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary">
            <Zap className="h-5 w-5 text-white" />
          </span>
          <p className="text-white/80">
            <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-sm text-white">
              POST /shock
            </code>{' '}
            simule un choc de marché par-dessus la donnée réelle, pour tester
            la réactivité du système en démo.
          </p>
        </div>
      </Reveal>
    </Section>
  )
}
