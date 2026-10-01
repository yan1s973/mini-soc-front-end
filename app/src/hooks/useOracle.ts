import { useCallback, useEffect, useState } from 'react'
import {
  createInitialState,
  refresh,
  rollback,
  shock,
  step,
} from '../data/simulation'

const TICK_MS = 1000

// Single entry point for dashboard data. It currently drives the in-browser
// simulation; to plug the real backend, replace the interval with the
// Socket.io stream and the actions with calls to POST /shock and /rollback.
export function useOracle() {
  const [state, setState] = useState(() => createInitialState(Date.now()))

  useEffect(() => {
    const id = window.setInterval(
      () => setState((previous) => step(previous, Date.now())),
      TICK_MS,
    )
    return () => window.clearInterval(id)
  }, [])

  const triggerShock = useCallback(() => setState(shock), [])
  const triggerRollback = useCallback(() => setState(rollback), [])
  const triggerRefresh = useCallback(() => setState(refresh), [])

  return {
    state,
    actions: {
      shock: triggerShock,
      rollback: triggerRollback,
      refresh: triggerRefresh,
    },
  }
}

export type OracleActions = ReturnType<typeof useOracle>['actions']
