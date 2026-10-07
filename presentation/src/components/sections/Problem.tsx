import {
  Activity,
  BrainCircuit,
  Database,
  GitCompareArrows,
  Gauge,
  ShieldCheck,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import { Reveal } from '../ui/Reveal'
import { Card, Section, SectionHeader } from '../ui/Section'

type Challenge = {
  icon: LucideIcon
  question: string
  answer: string
}

const challenges: Challenge[] = [
  {
    icon: Database,
    question: 'Récupérer les données',
    answer: 'Un flux de données réel, interrogé en continu, avec un cache Redis en cas de panne.',
  },
  {
    icon: BrainCircuit,
    question: 'Faire des prédictions',
    answer: 'Un réseau de neurones TensorFlow.js prédit la prochaine valeur.',
  },
  {
    icon: Gauge,
    question: 'Mesurer leur qualité',
    answer: "L'erreur est calculée à chaque point, dès que la vraie valeur arrive.",
  },
  {
    icon: Activity,
    question: 'Détecter les dérives',
    answer: 'Deux méthodes statistiques doivent s’accorder avant toute action.',
  },
  {
    icon: GitCompareArrows,
    question: 'Comparer les candidats',
    answer: 'Quatre architectures sont entraînées, la meilleure est comparée au modèle en service.',
  },
  {
    icon: Workflow,
    question: 'Corriger sans bloquer',
    answer: 'Le réentraînement s’exécute à part, pendant que le service continue de fonctionner.',
  },
  {
    icon: ShieldCheck,
    question: 'Évaluer les performances',
    answer: 'Fausses alertes et délai de détection sont calculés à partir des données enregistrées.',
  },
]

export function Problem() {
  return (
    <Section id="projet">
      <SectionHeader
        tag="Pourquoi ce projet"
        title={
          <>
            Comment fonctionne vraiment une IA{' '}
            <em className="italic">une fois déployée</em> ?
          </>
        }
      >
        Dans une entreprise, le plus difficile n'est pas de créer le modèle :
        c'est tout ce qu'il y a autour pour le faire fonctionner dans la durée.
        DataOracle doit répondre à chacune de ces questions.
      </SectionHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {challenges.map((challenge, index) => (
          <Reveal key={challenge.question} delay={index * 60}>
            <Card className="h-full">
              <challenge.icon className="h-6 w-6 text-lavender" />
              <h3 className="mt-5 font-manrope text-base font-semibold text-white">
                {challenge.question}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                {challenge.answer}
              </p>
            </Card>
          </Reveal>
        ))}
        <Reveal delay={challenges.length * 60}>
          <div className="flex h-full flex-col justify-between rounded-2xl bg-primary p-6">
            <p className="font-serif text-3xl leading-tight text-white">
              Sept questions, <em className="italic">une</em> plateforme.
            </p>
            <a
              href="#fonctionnement"
              className="mt-6 font-cabin text-base font-medium text-white transition-opacity hover:opacity-80"
            >
              Voir comment ça marche →
            </a>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}
