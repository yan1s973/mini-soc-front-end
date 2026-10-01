import { Sparkles, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Reveal } from '../ui/Reveal'
import { Section, SectionHeader } from '../ui/Section'

type Status = 'stable' | 'surveillance' | 'drift' | 'retraining'

type Point = {
  price: number
  prediction: number
  error: number
}

type SimulationState = {
  points: Point[]
  status: Status
  highStreak: number
  shockLeft: number
  retrainLeft: number
  version: number
  retrains: number
}

const WINDOW = 40
const ERROR_ALERT = 90
const STREAK_FOR_DRIFT = 4
const SHOCK_TICKS = 9
const RETRAIN_TICKS = 4

const statusLabel: Record<Status, string> = {
  stable: 'Stable',
  surveillance: 'Surveillance',
  drift: 'Drift détecté',
  retraining: 'Réentraînement',
}

const statusColor: Record<Status, string> = {
  stable: 'bg-emerald-400',
  surveillance: 'bg-amber-400',
  drift: 'bg-rose-500',
  retraining: 'bg-primary',
}

const oracleMessage: Record<Status, string> = {
  stable:
    'Le marché évolue normalement. Mes prédictions restent proches du prix réel, aucune action n’est nécessaire.',
  surveillance:
    'Mes dernières erreurs sont plus élevées que d’habitude. Je surveille : un pic isolé ne suffit pas à déclencher un réentraînement.',
  drift:
    'Les deux méthodes de détection sont d’accord : le marché a changé de comportement. Je lance un réentraînement.',
  retraining:
    '4 architectures candidates s’affrontent dans un worker séparé. Le service continue de fonctionner pendant ce temps.',
}

const formatPrice = (value: number) =>
  `${value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} $`

const randomMove = (amplitude: number) => (Math.random() - 0.5) * 2 * amplitude

function createInitialState(): SimulationState {
  const points: Point[] = []
  let price = 64250
  for (let i = 0; i < WINDOW; i++) {
    const prediction = price + randomMove(15)
    price += randomMove(30)
    points.push({ price, prediction, error: Math.abs(price - prediction) })
  }
  return {
    points,
    status: 'stable',
    highStreak: 0,
    shockLeft: 0,
    retrainLeft: 0,
    version: 3,
    retrains: 2,
  }
}

function tick(state: SimulationState): SimulationState {
  const last = state.points[state.points.length - 1]
  // The model extrapolates from the last price; a shock pushes the market away from it.
  const prediction = last.price + randomMove(15)
  const price = last.price + randomMove(30) + (state.shockLeft > 0 ? 170 : 0)
  const error = Math.abs(price - prediction)
  const highStreak = error > ERROR_ALERT ? state.highStreak + 1 : 0

  const next: SimulationState = {
    ...state,
    points: [...state.points.slice(1), { price, prediction, error }],
    highStreak,
    shockLeft: Math.max(0, state.shockLeft - 1),
  }

  if (state.retrainLeft > 0) {
    next.retrainLeft = state.retrainLeft - 1
    if (next.retrainLeft === 0) {
      next.status = 'stable'
      next.version = state.version + 1
      next.retrains = state.retrains + 1
      next.highStreak = 0
    } else {
      next.status = 'retraining'
    }
  } else if (highStreak >= STREAK_FOR_DRIFT) {
    next.status = 'drift'
    next.retrainLeft = RETRAIN_TICKS
  } else {
    next.status = highStreak > 0 ? 'surveillance' : 'stable'
  }

  return next
}

function LiveChart({ points }: { points: Point[] }) {
  const width = 600
  const height = 200
  const values = points.flatMap((point) => [point.price, point.prediction])
  const lowest = Math.min(...values) - 20
  const highest = Math.max(...values) + 20
  const x = (i: number) => (i / (points.length - 1)) * width
  const y = (v: number) => height - ((v - lowest) / (highest - lowest)) * height
  const line = (key: 'price' | 'prediction') =>
    points.map((point, i) => `${x(i)},${y(point[key])}`).join(' ')

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="h-48 w-full md:h-56"
      role="img"
      aria-label="Graphique temps réel du prix et de la prédiction"
    >
      {[0.25, 0.5, 0.75].map((ratio) => (
        <line
          key={ratio}
          x1={0}
          x2={width}
          y1={height * ratio}
          y2={height * ratio}
          stroke="#ffffff10"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <polyline
        points={line('prediction')}
        fill="none"
        stroke="#7b39fc"
        strokeWidth={2}
        strokeDasharray="6 4"
        vectorEffect="non-scaling-stroke"
      />
      <polyline
        points={line('price')}
        fill="none"
        stroke="#ffffff"
        strokeWidth={2}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/40 p-4">
      <p className="text-xs text-white/50">{label}</p>
      <p className="mt-1 font-manrope text-lg font-semibold text-white tabular-nums">
        {value}
      </p>
    </div>
  )
}

export function Dashboard() {
  const [state, setState] = useState(createInitialState)

  useEffect(() => {
    const id = window.setInterval(() => setState(tick), 1000)
    return () => window.clearInterval(id)
  }, [])

  const current = state.points[state.points.length - 1]
  const recent = state.points.slice(-20)
  const averageError =
    recent.reduce((total, point) => total + point.error, 0) / recent.length

  const triggerShock = () =>
    setState((previous) => ({ ...previous, shockLeft: SHOCK_TICKS }))

  return (
    <Section id="dashboard">
      <SectionHeader
        tag="Dashboard & Oracle AI"
        title={
          <>
            Tout suivre <em className="italic">en temps réel</em>
          </>
        }
      >
        Le tableau de bord reçoit chaque nouvelle donnée par WebSocket, sans
        rechargement. Essayez : simulez un choc de marché et regardez le
        système réagir.
      </SectionHeader>

      <Reveal>
        <div className="overflow-hidden rounded-3xl border border-[rgba(164,132,215,0.3)] bg-surface shadow-[0_0_80px_rgba(123,57,252,0.15)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-5 py-4 md:px-6">
            <div className="flex items-center gap-3">
              <span className="font-manrope text-sm font-semibold text-white">
                DataOracle · BTC/USD
              </span>
              <span className="flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 font-cabin text-xs text-white">
                <span
                  className={`h-2 w-2 rounded-full ${statusColor[state.status]} ${
                    state.status === 'stable' ? '' : 'animate-pulse'
                  }`}
                />
                {statusLabel[state.status]}
              </span>
            </div>
            <button
              type="button"
              onClick={triggerShock}
              disabled={state.shockLeft > 0 || state.retrainLeft > 0}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-manrope text-sm font-semibold text-[#fafafa] transition-colors hover:bg-[#8d52fd] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Zap className="h-4 w-4" />
              Simuler un choc
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 md:p-6 lg:grid-cols-6">
            <Stat label="Prix actuel" value={formatPrice(current.price)} />
            <Stat label="Prédiction IA" value={formatPrice(current.prediction)} />
            <Stat label="Erreur" value={current.error.toFixed(1)} />
            <Stat label="Erreur moyenne" value={averageError.toFixed(1)} />
            <Stat label="Réentraînements" value={String(state.retrains)} />
            <Stat label="Modèle actif" value={`v${state.version}`} />
          </div>

          <div className="px-5 md:px-6">
            <div className="flex items-center gap-5 text-xs text-white/60">
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-5 bg-white" /> Prix réel
              </span>
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-5 border-t-2 border-dashed border-primary" />{' '}
                Prédiction
              </span>
            </div>
            <div className="mt-3">
              <LiveChart points={state.points} />
            </div>
          </div>

          <div className="m-5 flex gap-4 rounded-2xl bg-primary-dark/70 p-5 md:m-6">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary">
              <Sparkles className="h-5 w-5 text-white" />
            </span>
            <div>
              <p className="font-cabin text-sm font-medium text-lavender">
                Oracle AI
              </p>
              <p className="mt-1 text-white/90" aria-live="polite">
                {oracleMessage[state.status]}
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <p className="mt-4 text-center text-sm text-white/40">
          Démonstration simulée dans votre navigateur, avec des données
          fictives. Le vrai dashboard est alimenté par le flux CoinGecko.
        </p>
      </Reveal>

      <div className="mx-auto mt-12 max-w-[760px] text-center">
        <Reveal>
          <p className="text-lg text-white/70">
            <span className="font-semibold text-white">Oracle AI</span> est une
            couche d'explication en langage naturel. Au lieu d'afficher
            « Erreur : 15 », elle explique ce qui se passe et ce que le système
            fait : une première approche d'IA explicable (
            <em>Explainable AI</em>).
          </p>
        </Reveal>
      </div>
    </Section>
  )
}
