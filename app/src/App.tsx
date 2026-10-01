import { Hero } from './components/Hero'
import { Dashboard } from './components/dashboard/Dashboard'
import { Toasts } from './components/dashboard/Toasts'
import { useOracle } from './hooks/useOracle'

function App() {
  const { state, actions } = useOracle()

  return (
    <main className="relative overflow-x-clip">
      <Hero onShock={actions.shock} />
      <Dashboard state={state} actions={actions} />
      <Toasts logs={state.logs} now={state.now} />
    </main>
  )
}

export default App
