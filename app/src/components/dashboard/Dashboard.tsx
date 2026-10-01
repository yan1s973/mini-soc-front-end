import { useState } from 'react'
import type { OracleActions } from '../../hooks/useOracle'
import type { OracleState } from '../../data/types'
import { ActivityTable } from './ActivityTable'
import { AnomaliesPanel } from './AnomaliesPanel'
import { Leaderboard } from './Leaderboard'
import { OraclePanel } from './OraclePanel'
import { PriceChart } from './PriceChart'
import { MobileTabs, Sidebar } from './Sidebar'
import { StatCards } from './StatCards'
import { TopBar } from './TopBar'
import { VersionsPanel } from './VersionsPanel'

type DashboardProps = {
  state: OracleState
  actions: OracleActions
}

export function Dashboard({ state, actions }: DashboardProps) {
  const [active, setActive] = useState('vue-ensemble')
  const [query, setQuery] = useState('')

  return (
    <section
      id="dashboard"
      className="relative z-10 mx-auto mt-20 max-w-[1360px] scroll-mt-4 px-3 pb-24 md:mt-28 md:px-6 lg:px-10"
    >
      <div className="rounded-[28px] border border-white/15 bg-white/[0.06] p-1.5 shadow-[0_0_120px_rgba(123,57,252,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-2xl backdrop-saturate-150 md:p-2">
        <div className="flex overflow-hidden rounded-[22px] border border-white/[0.06] bg-black/45">
          <Sidebar active={active} onSelect={setActive} />

          <div className="min-w-0 flex-1">
            <TopBar
              now={state.now}
              query={query}
              onQueryChange={setQuery}
              anomalyCount={state.anomalies.length}
            />
            <MobileTabs active={active} onSelect={setActive} />

            <div className="space-y-4 p-3 md:p-6">
              <StatCards state={state} />

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <PriceChart state={state} actions={actions} />
                <div className="flex flex-col gap-4">
                  <OraclePanel state={state} />
                  <AnomaliesPanel anomalies={state.anomalies} />
                </div>
              </div>

              <ActivityTable logs={state.logs} query={query} />

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Leaderboard state={state} />
                <VersionsPanel state={state} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
