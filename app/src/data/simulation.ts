// In-browser simulation of the DataOracle backend. It runs the same logic as
// the real platform (dynamic threshold + Page-Hinkley, champion/challenger,
// versioning, rollback) on fictitious prices, so the dashboard works offline.
import type {
  Candidate,
  DriftStatus,
  LogEntry,
  ModelVersion,
  OracleState,
  Point,
} from './types'

const WINDOW = 60
const PRICE_NOISE = 30
const PREDICTION_NOISE = 15
const SHOCK_MOVE = 170
const SHOCK_TICKS = 8
const ANOMALY_CHANCE = 0.025

const THRESHOLD_WINDOW = 30
const THRESHOLD_SIGMAS = 2
const ANOMALY_SIGMAS = 4
const STREAK_FOR_ALARM = 3

const PH_DELTA = 10
const PH_LAMBDA = 200

const RETRAIN_TICKS = 6
const MAX_LOGS = 60
const MAX_ANOMALIES = 8

const ARCHITECTURES = [
  '1 × 16 · ReLU',
  '2 × 32 · ReLU',
  '2 × 64 · tanh',
  '3 × 64 · ELU',
]

const jitter = (amplitude: number) => (Math.random() - 0.5) * 2 * amplitude

const mean = (values: number[]) =>
  values.reduce((total, value) => total + value, 0) / Math.max(values.length, 1)

const std = (values: number[]) => {
  const average = mean(values)
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)))
}

const freshCandidates = (): Candidate[] =>
  ARCHITECTURES.map((architecture, index) => ({
    name: String.fromCharCode(65 + index),
    architecture,
    progress: 0,
    valError: null,
  }))

function pushLog(
  state: OracleState,
  entry: Omit<LogEntry, 'id' | 'time'>,
): OracleState {
  const log: LogEntry = { ...entry, id: state.nextId, time: state.now }
  return {
    ...state,
    nextId: state.nextId + 1,
    logs: [log, ...state.logs].slice(0, MAX_LOGS),
  }
}

export function createInitialState(now: number): OracleState {
  const points: Point[] = []
  let price = 64250
  for (let i = WINDOW; i > 0; i--) {
    const prediction = price + jitter(PREDICTION_NOISE)
    price += jitter(PRICE_NOISE)
    points.push({
      time: now - i * 1000,
      price,
      prediction,
      error: Math.abs(price - prediction),
      anomaly: false,
      outlier: false,
    })
  }

  const hour = 3600_000
  const versions: ModelVersion[] = [
    {
      version: 1,
      deployedAt: now - 5 * hour,
      errorAtSwitch: null,
      architecture: '2 × 32 · ReLU',
    },
    {
      version: 2,
      deployedAt: now - 3 * hour,
      errorAtSwitch: 142.6,
      architecture: '3 × 64 · ELU',
    },
    {
      version: 3,
      deployedAt: now - 40 * 60_000,
      errorAtSwitch: 157.9,
      architecture: '2 × 32 · ReLU',
    },
  ]

  const lastCandidates: Candidate[] = [
    { name: 'A', architecture: ARCHITECTURES[0], progress: 1, valError: 38.4 },
    { name: 'B', architecture: ARCHITECTURES[1], progress: 1, valError: 19.7 },
    { name: 'C', architecture: ARCHITECTURES[2], progress: 1, valError: 26.1 },
    { name: 'D', architecture: ARCHITECTURES[3], progress: 1, valError: 31.5 },
  ]

  const seedLogs: Omit<LogEntry, 'id'>[] = [
    {
      time: now - 2000,
      status: 'info',
      source: 'WebSocket',
      type: 'Connexion',
      details: 'Dashboard connecté au flux temps réel',
    },
    {
      time: now - 40 * 60_000,
      status: 'deployed',
      source: 'Worker',
      type: 'Déploiement',
      details: 'Challenger B (val. 19.7) bat le champion (157.9) → v3',
    },
    {
      time: now - 40 * 60_000 - 8000,
      status: 'queued',
      source: 'BullMQ',
      type: 'Réentraînement',
      details: 'Job ajouté à la queue : 4 architectures candidates',
    },
    {
      time: now - 40 * 60_000 - 9000,
      status: 'alert',
      source: 'Détecteurs',
      type: 'Drift',
      details: 'Seuil dynamique et Page-Hinkley d’accord',
    },
  ]

  return {
    now,
    points,
    status: 'stable',
    detectors: {
      threshold: { limit: 0, streak: 0, alarm: false },
      pageHinkley: { value: 0, lambda: PH_LAMBDA, alarm: false },
    },
    retrains: 2,
    versions,
    activeVersion: 3,
    logs: seedLogs.map((log, index) => ({ ...log, id: index + 1 })),
    anomalies: [],
    job: null,
    lastJob: {
      finishedAt: now - 40 * 60_000,
      candidates: lastCandidates,
      challenger: lastCandidates[1],
      championError: 157.9,
      deployed: true,
    },
    shockLeft: 0,
    pageHinkley: { count: 0, mean: 0, sum: 0, min: 0 },
    ticks: 0,
    nextId: seedLogs.length + 1,
  }
}

function advanceJob(state: OracleState): OracleState {
  const job = state.job
  if (!job) return state

  const ticksLeft = job.ticksLeft - 1
  const candidates = job.candidates.map((candidate) => ({
    ...candidate,
    progress: Math.min(1, candidate.progress + 1 / (RETRAIN_TICKS - 1)),
  }))
  let next: OracleState = { ...state, job: { ticksLeft, candidates } }

  if (ticksLeft > 0) return next

  // Evaluate every candidate on the same held-out validation set.
  const evaluated = candidates.map((candidate) => ({
    ...candidate,
    progress: 1,
    valError: Math.round((14 + Math.random() * 30) * 10) / 10,
  }))
  const challenger = evaluated.reduce((best, candidate) =>
    (candidate.valError ?? Infinity) < (best.valError ?? Infinity)
      ? candidate
      : best,
  )
  // The champion is scored on the same recent data, after the regime changed.
  const recentErrors = state.points.slice(-8).map((point) => point.error)
  const championError = Math.round(mean(recentErrors) * 10) / 10
  const deployed = (challenger.valError ?? Infinity) < championError

  next = {
    ...next,
    job: null,
    retrains: state.retrains + 1,
    lastJob: {
      finishedAt: state.now,
      candidates: evaluated,
      challenger,
      championError,
      deployed,
    },
    pageHinkley: { count: 0, mean: 0, sum: 0, min: 0 },
    detectors: {
      ...state.detectors,
      threshold: { ...state.detectors.threshold, streak: 0, alarm: false },
      pageHinkley: { ...state.detectors.pageHinkley, value: 0, alarm: false },
    },
  }

  if (!deployed) {
    return pushLog(next, {
      status: 'processed',
      source: 'Worker',
      type: 'Champion conservé',
      details: `Challenger ${challenger.name} (val. ${challenger.valError}) ne bat pas le champion (${championError})`,
      notify: true,
    })
  }

  const version = Math.max(...state.versions.map((v) => v.version)) + 1
  next = {
    ...next,
    activeVersion: version,
    versions: [
      ...state.versions,
      {
        version,
        deployedAt: state.now,
        errorAtSwitch: championError,
        architecture: challenger.architecture,
      },
    ],
  }
  return pushLog(next, {
    status: 'deployed',
    source: 'Worker',
    type: 'Déploiement',
    details: `Challenger ${challenger.name} (val. ${challenger.valError}) bat le champion (${championError}) → v${version}`,
    notify: true,
  })
}

export function step(previous: OracleState, now: number): OracleState {
  let state: OracleState = { ...previous, now, ticks: previous.ticks + 1 }
  const last = state.points[state.points.length - 1]

  // 1. The model predicts, then the real value arrives.
  const prediction = last.price + jitter(PREDICTION_NOISE)
  const isSpike =
    state.shockLeft === 0 && !state.job && Math.random() < ANOMALY_CHANCE
  const spike = isSpike ? (Math.random() < 0.5 ? -1 : 1) * (140 + Math.random() * 40) : 0
  const price =
    last.price +
    jitter(PRICE_NOISE) +
    (state.shockLeft > 0 ? SHOCK_MOVE : 0) +
    spike
  const error = Math.abs(price - prediction)

  // 2. Method 1: dynamic threshold (mean + 2σ of recent normal errors).
  // Outliers are left out so a drift cannot raise its own threshold.
  const recent = state.points
    .filter((point) => !point.outlier)
    .slice(-THRESHOLD_WINDOW)
    .map((point) => point.error)
  const recentMean = mean(recent)
  const recentStd = std(recent)
  const limit = recentMean + THRESHOLD_SIGMAS * recentStd
  const streak = error > limit ? state.detectors.threshold.streak + 1 : 0
  const thresholdAlarm = streak >= STREAK_FOR_ALARM

  // 3. Method 2: Page-Hinkley on the error stream.
  const ph = { ...state.pageHinkley }
  ph.count += 1
  ph.mean += (error - ph.mean) / ph.count
  ph.sum += error - ph.mean - PH_DELTA
  ph.min = Math.min(ph.min, ph.sum)
  const phValue = ph.sum - ph.min
  const phAlarm = phValue > PH_LAMBDA

  // Isolated, very large error: alert without retraining.
  const isAnomaly =
    error > recentMean + ANOMALY_SIGMAS * recentStd &&
    state.detectors.threshold.streak === 0

  state = {
    ...state,
    shockLeft: Math.max(0, state.shockLeft - 1),
    pageHinkley: ph,
    points: [
      ...state.points.slice(1),
      {
        time: now,
        price,
        prediction,
        error,
        anomaly: isAnomaly,
        outlier: error > limit,
      },
    ],
    detectors: {
      threshold: { limit, streak, alarm: thresholdAlarm },
      pageHinkley: { value: phValue, lambda: PH_LAMBDA, alarm: phAlarm },
    },
  }

  if (isAnomaly) {
    state = {
      ...state,
      anomalies: [
        { id: state.nextId, time: now, error, price },
        ...state.anomalies,
      ].slice(0, MAX_ANOMALIES),
    }
    state = pushLog(state, {
      status: 'alert',
      source: 'Détecteurs',
      type: 'Anomalie',
      details: `Erreur isolée de ${error.toFixed(1)} : alerte, pas de réentraînement`,
      notify: true,
    })
  }

  // 4. Drift is official only when both methods agree.
  let status: DriftStatus
  if (state.job) {
    status = 'retraining'
    state = advanceJob(state)
    if (!state.job) status = 'stable'
  } else if (thresholdAlarm && phAlarm) {
    status = 'drift'
    state = pushLog(state, {
      status: 'alert',
      source: 'Détecteurs',
      type: 'Drift',
      details: 'Seuil dynamique et Page-Hinkley d’accord : dérive confirmée',
      notify: true,
    })
    state = pushLog(
      { ...state, job: { ticksLeft: RETRAIN_TICKS, candidates: freshCandidates() } },
      {
        status: 'queued',
        source: 'BullMQ',
        type: 'Réentraînement',
        details: 'Job ajouté à la queue : 4 architectures candidates',
      },
    )
  } else if (streak > 0 || phAlarm) {
    status = 'surveillance'
  } else {
    status = 'stable'
  }

  // 5. Every point is persisted; log one line every few seconds.
  if (state.ticks % 5 === 0) {
    state = pushLog(state, {
      status: 'processed',
      source: 'PostgreSQL',
      type: 'Prédiction',
      details: `Prix ${price.toFixed(0)} · prédit ${prediction.toFixed(0)} · erreur ${error.toFixed(1)}`,
    })
  }

  return { ...state, status }
}

export function shock(state: OracleState): OracleState {
  if (state.shockLeft > 0 || state.job) return state
  return pushLog(
    { ...state, shockLeft: SHOCK_TICKS },
    {
      status: 'info',
      source: 'API',
      type: 'POST /shock',
      details: 'Choc de marché simulé par-dessus la donnée',
      notify: true,
    },
  )
}

export function rollback(state: OracleState): OracleState {
  if (state.job) return state
  const sorted = [...state.versions].sort((a, b) => a.version - b.version)
  const index = sorted.findIndex((v) => v.version === state.activeVersion)
  if (index <= 0) {
    return pushLog(state, {
      status: 'info',
      source: 'API',
      type: 'POST /rollback',
      details: 'Aucune version antérieure disponible',
      notify: true,
    })
  }
  const target = sorted[index - 1].version
  return pushLog(
    { ...state, activeVersion: target },
    {
      status: 'deployed',
      source: 'API',
      type: 'Rollback',
      details: `Poids de v${target} rechargés depuis le disque`,
      notify: true,
    },
  )
}

export function refresh(state: OracleState): OracleState {
  return pushLog(state, {
    status: 'info',
    source: 'API',
    type: 'Actualisation',
    details: 'GET /leaderboard, GET /models : panneaux à jour',
  })
}
