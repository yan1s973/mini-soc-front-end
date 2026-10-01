import { Reveal } from '../ui/Reveal'
import { Card, Section, Tag } from '../ui/Section'

// Illustrative price series used only to draw the sliding window.
const windowValues = [42, 55, 48, 63, 58, 71, 66, 74, 69, 80]

export function Brain() {
  return (
    <Section id="cerveau">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <Tag>Le cerveau</Tag>
          <h2 className="mt-5 font-serif text-4xl leading-[1.1] text-white md:text-6xl">
            Un réseau de neurones qui regarde{' '}
            <em className="italic">les 10 dernières</em> valeurs
          </h2>
          <p className="mt-6 text-lg text-white/70">
            Le cœur de DataOracle est un réseau de neurones développé avec
            TensorFlow.js. Il est entraîné sur une fenêtre glissante : à partir
            des 10 dernières valeurs, il prédit la suivante.
          </p>
          <p className="mt-4 text-lg text-white/70">
            Les prix sont normalisés entre 0 et 1 (min-max) avant
            l'entraînement, puis remis à l'échelle à la sortie.
          </p>
        </Reveal>

        <Reveal delay={150}>
          <Card className="p-6 md:p-8">
            <p className="font-cabin text-sm font-medium text-white/50">
              Fenêtre glissante
            </p>
            <div className="mt-6 flex h-40 items-end gap-1.5 sm:gap-2">
              {windowValues.map((value, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-t-md bg-lavender/40"
                  style={{ height: `${value}%` }}
                />
              ))}
              <div
                className="flex-1 rounded-t-md border-2 border-dashed border-primary bg-primary/30"
                style={{ height: '86%' }}
              />
            </div>
            <div className="mt-3 flex gap-1.5 text-xs text-white/50 sm:gap-2">
              <span className="flex-[10] border-t border-white/20 pt-2 text-center">
                10 valeurs observées
              </span>
              <span className="flex-1 border-t border-primary pt-2 text-center text-lavender">
                ?
              </span>
            </div>

            <div className="mt-8 rounded-xl bg-black/60 p-4 text-center font-mono text-sm text-white/80">
              x<sub>norm</sub> = (x − min) / (max − min)
            </div>
          </Card>
        </Reveal>
      </div>
    </Section>
  )
}
