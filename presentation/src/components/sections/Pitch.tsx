import { Reveal } from '../ui/Reveal'
import { Section, Tag } from '../ui/Section'

export function Pitch() {
  return (
    <Section id="pitch" className="bg-surface/60">
      <Reveal className="mx-auto flex max-w-[900px] flex-col items-center text-center">
        <Tag>DataOracle en une minute</Tag>
        <blockquote className="mt-8 font-serif text-2xl leading-snug text-white md:text-[34px]">
          « DataOracle est une plateforme MLOps développée en Node.js et
          TensorFlow.js, qui simule le cycle de vie complet d'un modèle de
          Machine Learning en production sur un vrai flux de données de marché.
          Il prédit en temps réel, détecte les dérives avec{' '}
          <em className="text-lavender italic">
            deux méthodes statistiques complémentaires
          </em>{' '}
          et ne réentraîne que si les deux sont d'accord. Le réentraînement met
          en compétition plusieurs architectures et suit un pattern{' '}
          <em className="text-lavender italic">champion / challenger</em>, dans
          un worker asynchrone qui ne bloque jamais le service. Chaque version
          est rechargeable par un vrai rollback. Et plutôt que d'affirmer que
          ça fonctionne,{' '}
          <em className="text-lavender italic">je l'ai mesuré</em>. »
        </blockquote>
      </Reveal>
    </Section>
  )
}
