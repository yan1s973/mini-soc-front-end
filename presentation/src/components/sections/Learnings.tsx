import { Scale } from 'lucide-react'
import { Reveal } from '../ui/Reveal'
import { Card, Section, SectionHeader } from '../ui/Section'

const skills = [
  'Architecture backend en couches',
  'API REST documentée',
  'PostgreSQL et Redis',
  'TensorFlow.js et séries temporelles',
  'Drift detection (deux méthodes)',
  'Champion / challenger',
  'AutoML par recherche d’architecture',
  'Architecture asynchrone (queue, worker)',
  'Explainable AI',
  'Évaluation quantitative',
  'Tests et logging structuré',
  'WebSockets et CI/CD',
]

const questions = [
  {
    question: 'Comment savoir qu’il dérive ?',
    answer: 'Deux méthodes, pas une intuition.',
  },
  {
    question: 'Faut-il vraiment réentraîner ?',
    answer: 'Champion / challenger, pas un remplacement aveugle.',
  },
  {
    question: 'Comment ne pas bloquer le service ?',
    answer: 'Un worker asynchrone dédié.',
  },
  {
    question: 'Comment prouver que ça marche ?',
    answer: 'Une évaluation chiffrée et documentée.',
  },
]

export function Learnings() {
  return (
    <Section id="apprentissages">
      <SectionHeader
        tag="Ce que j'ai appris"
        title={
          <>
            Plus qu'une liste de technos, <em className="italic">une démarche</em>
          </>
        }
      >
        Ce qui compte dans DataOracle, c'est que chaque brique répond à une
        vraie question qu'on se pose en mettant une IA en production.
      </SectionHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {questions.map((item, index) => (
          <Reveal key={item.question} delay={index * 60}>
            <Card className="h-full">
              <p className="font-serif text-2xl leading-tight text-white">
                {item.question}
              </p>
              <p className="mt-3 text-sm text-white/60">{item.answer}</p>
            </Card>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-12">
        <ul className="flex flex-wrap justify-center gap-2">
          {skills.map((skill) => (
            <li
              key={skill}
              className="rounded-lg border border-[rgba(164,132,215,0.3)] bg-primary-dark/50 px-3 py-1.5 font-cabin text-sm text-white/90"
            >
              {skill}
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal className="mx-auto mt-12 max-w-[820px]">
        <Card className="flex flex-col gap-4 border-[rgba(164,132,215,0.4)] sm:flex-row md:p-8">
          <Scale className="h-7 w-7 shrink-0 text-lavender" />
          <div>
            <h3 className="font-serif text-3xl text-white">
              Une limite <em className="italic">honnête</em>
            </h3>
            <p className="mt-3 text-white/70">
              Les seuils de détection (le multiplicateur d'écart-type, le λ de
              Page-Hinkley) sont calibrés empiriquement sur mes propres données
              de test, pas sur un jeu de données de référence. Une vraie
              validation scientifique demanderait de comparer ces performances
              à un dataset standard de la littérature du <em>concept drift</em>.
              C'est la suite logique du projet.
            </p>
          </div>
        </Card>
      </Reveal>
    </Section>
  )
}
