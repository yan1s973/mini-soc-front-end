import { Check, TriangleAlert } from 'lucide-react'
import { Reveal } from '../ui/Reveal'
import { Card, Section, SectionHeader } from '../ui/Section'

// Deterministic pseudo-noise in [0, 1) so the illustrations never change.
const noise = (i: number) => Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1)

const POINTS = 36
const CHANGE_AT = 26
const SPIKE_AT = 10

// Illustrative prediction errors: stable, one isolated spike, then a real drift.
const errors = Array.from({ length: POINTS }, (_, i) => {
  if (i === SPIKE_AT) return 14
  return i < CHANGE_AT ? 3 + noise(i) * 4 : 12 + noise(i) * 5
})

// Page-Hinkley on the errors above: cumulative deviation m_t, its running
// minimum M_t, and the first point where m_t - M_t exceeds lambda.
const pageHinkley = (() => {
  const lambda = 20
  const series: { sum: number; min: number }[] = []
  let detectedAt = -1
  errors.forEach((error, i) => {
    const previous = series[i - 1] ?? { sum: 0, min: 0 }
    const sum = previous.sum + error - 5 - 1
    const min = Math.min(previous.min, sum)
    if (detectedAt === -1 && sum - min > lambda) detectedAt = i
    series.push({ sum, min })
  })
  return { series, detectedAt }
})()

function ThresholdChart() {
  const threshold = 11
  const width = 360
  const height = 160
  const scale = 7
  const barWidth = width / POINTS

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label="Erreurs de prédiction comparées au seuil moyenne plus deux écarts-types"
    >
      {errors.map((error, i) => {
        const barHeight = error * scale
        const isAbove = error > threshold
        const fill = i === SPIKE_AT ? '#ffffff55' : isAbove ? '#7b39fc' : '#a484d755'
        return (
          <rect
            key={i}
            x={i * barWidth + 1.5}
            y={height - barHeight}
            width={barWidth - 3}
            height={barHeight}
            rx={2}
            fill={fill}
          />
        )
      })}
      <line
        x1={0}
        x2={width}
        y1={height - threshold * scale}
        y2={height - threshold * scale}
        stroke="#ffffff"
        strokeDasharray="4 4"
        strokeWidth={1}
      />
      <text
        x={4}
        y={height - threshold * scale - 6}
        fill="#ffffffaa"
        fontSize={10}
        fontFamily="Inter, sans-serif"
      >
        μ + 2σ
      </text>
    </svg>
  )
}

function PageHinkleyChart() {
  const width = 360
  const height = 160
  const { series, detectedAt } = pageHinkley

  const values = series.flatMap((point) => [point.sum, point.min])
  const lowest = Math.min(...values)
  const highest = Math.max(...values)
  const x = (i: number) => (i / (POINTS - 1)) * (width - 8) + 4
  const y = (v: number) =>
    height - 26 - ((v - lowest) / (highest - lowest)) * (height - 36)

  const line = (key: 'sum' | 'min') =>
    series.map((point, i) => `${x(i)},${y(point[key])}`).join(' ')

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label="Somme cumulée de Page-Hinkley qui s'éloigne de son minimum après le changement"
    >
      <polyline
        points={line('min')}
        fill="none"
        stroke="#ffffff"
        strokeDasharray="4 4"
        strokeWidth={1}
      />
      <polyline
        points={line('sum')}
        fill="none"
        stroke="#7b39fc"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {detectedAt !== -1 && (
        <>
          <line
            x1={x(detectedAt)}
            x2={x(detectedAt)}
            y1={y(series[detectedAt].sum)}
            y2={y(series[detectedAt].min)}
            stroke="#a484d7"
            strokeWidth={1.5}
          />
          <circle
            cx={x(detectedAt)}
            cy={y(series[detectedAt].sum)}
            r={4}
            fill="#ffffff"
          />
          <text
            x={x(detectedAt) + 8}
            y={(y(series[detectedAt].sum) + y(series[detectedAt].min)) / 2}
            fill="#ffffffaa"
            fontSize={10}
            fontFamily="Inter, sans-serif"
          >
            écart &gt; λ
          </text>
        </>
      )}
      <text
        x={width - 4}
        y={y(series[POINTS - 1].min) + 16}
        fill="#ffffffaa"
        fontSize={10}
        textAnchor="end"
        fontFamily="Inter, sans-serif"
      >
        minimum historique
      </text>
    </svg>
  )
}

export function Drift() {
  return (
    <Section id="derive" className="bg-surface/60">
      <SectionHeader
        tag="Détection de dérive"
        title={
          <>
            Deux méthodes, <em className="italic">pas une supposition</em>
          </>
        }
      >
        Une erreur isolée n'est pas grave. DataOracle ne réagit que si la
        dérive est réelle et soutenue, et seulement quand deux méthodes
        complémentaires sont d'accord.
      </SectionHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Reveal>
          <Card className="h-full md:p-8">
            <p className="font-cabin text-sm font-medium text-lavender">
              Méthode 1
            </p>
            <h3 className="mt-2 font-serif text-3xl text-white">
              Seuil statistique dynamique
            </h3>
            <div className="mt-6">
              <ThresholdChart />
            </div>
            <p className="mt-6 text-white/70">
              Plutôt qu'un seuil fixe, le système recalcule en continu la
              moyenne et l'écart-type des erreurs récentes. Une erreur est
              anormale si elle dépasse{' '}
              <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-sm text-white">
                moyenne + 2 × écart-type
              </code>
              , la définition statistique d'une valeur aberrante.
            </p>
            <p className="mt-3 text-white/70">
              Un compteur d'occurrences consécutives ignore les pics isolés,
              comme la barre grise ci-dessus.
            </p>
          </Card>
        </Reveal>

        <Reveal delay={150}>
          <Card className="h-full md:p-8">
            <p className="font-cabin text-sm font-medium text-lavender">
              Méthode 2
            </p>
            <h3 className="mt-2 font-serif text-3xl text-white">Page-Hinkley</h3>
            <div className="mt-6">
              <PageHinkleyChart />
            </div>
            <p className="mt-6 text-white/70">
              Un algorithme de détection de changement de moyenne issu du
              traitement du signal (Page, 1954), popularisé pour le{' '}
              <em>concept drift</em> par Gama et al.
            </p>
            <p className="mt-3 text-white/70">
              Il cumule les écarts entre chaque erreur et une tolérance, et
              signale une dérive quand cette somme s'éloigne durablement de son
              minimum historique, au-delà d'un seuil λ.
            </p>
          </Card>
        </Reveal>
      </div>

      <Reveal className="mt-4">
        <div className="grid grid-cols-1 items-center gap-6 rounded-2xl bg-primary p-6 md:grid-cols-[1fr_auto_1fr] md:p-8">
          <div className="flex flex-col gap-3 font-manrope text-sm font-semibold text-white">
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4" /> Seuil dynamique : anormal
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4" /> Page-Hinkley : changement détecté
            </span>
          </div>
          <span className="hidden font-serif text-4xl text-white/80 md:block" aria-hidden="true">
            =
          </span>
          <p className="font-serif text-3xl leading-tight text-white">
            Drift <em className="italic">officiel</em>, réentraînement
            déclenché.
          </p>
        </div>
      </Reveal>

      <Reveal className="mt-4">
        <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <TriangleAlert className="h-6 w-6 shrink-0 text-lavender" />
          <p className="text-white/70">
            <span className="font-semibold text-white">
              Anomalie ou dérive ?
            </span>{' '}
            Une erreur isolée mais énorme déclenche une alerte d'anomalie, sans
            lancer de réentraînement inutile. Seule une dérive progressive et
            confirmée modifie le modèle.
          </p>
        </Card>
      </Reveal>
    </Section>
  )
}
