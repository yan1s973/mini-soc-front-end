export type DriftStatus = 'stable' | 'surveillance' | 'drift' | 'retraining'

export type Point = {
  time: number
  price: number
  prediction: number
  error: number
  anomaly: boolean
  // Above the dynamic threshold: excluded from the threshold's own reference.
  outlier: boolean
}

export type LogStatus = 'processed' | 'queued' | 'alert' | 'deployed' | 'info'

export type LogEntry = {
  id: number
  time: number
  status: LogStatus
  source: string
  type: string
  details: string
  // Also surfaced as a toast notification.
  notify?: boolean
}

export type Candidate = {
  name: string
  architecture: string
  progress: number
  valError: number | null
}

export type ModelVersion = {
  version: number
  deployedAt: number
  errorAtSwitch: number | null
  architecture: string
}

export type Anomaly = {
  id: number
  time: number
  error: number
  price: number
}

export type Detectors = {
  threshold: { limit: number; streak: number; alarm: boolean }
  pageHinkley: { value: number; lambda: number; alarm: boolean }
}

export type RetrainJob = {
  ticksLeft: number
  candidates: Candidate[]
}

export type JobResult = {
  finishedAt: number
  candidates: Candidate[]
  challenger: Candidate
  championError: number
  deployed: boolean
}

export type OracleState = {
  now: number
  points: Point[]
  status: DriftStatus
  detectors: Detectors
  retrains: number
  versions: ModelVersion[]
  activeVersion: number
  logs: LogEntry[]
  anomalies: Anomaly[]
  job: RetrainJob | null
  lastJob: JobResult | null
  shockLeft: number
  pageHinkley: { count: number; mean: number; sum: number; min: number }
  ticks: number
  nextId: number
}
