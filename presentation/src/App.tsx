import { Hero } from './components/Hero'
import { Architecture } from './components/sections/Architecture'
import { Brain } from './components/sections/Brain'
import { Cycle } from './components/sections/Cycle'
import { Dashboard } from './components/sections/Dashboard'
import { Drift } from './components/sections/Drift'
import { Evaluation } from './components/sections/Evaluation'
import { Footer } from './components/sections/Footer'
import { Learnings } from './components/sections/Learnings'
import { Pitch } from './components/sections/Pitch'
import { Problem } from './components/sections/Problem'
import { Retraining } from './components/sections/Retraining'
import { Versioning } from './components/sections/Versioning'

function App() {
  return (
    <>
      <main>
        <Hero />
        <Problem />
        <Cycle />
        <Brain />
        <Drift />
        <Retraining />
        <Versioning />
        <Dashboard />
        <Architecture />
        <Evaluation />
        <Pitch />
        <Learnings />
      </main>
      <Footer />
    </>
  )
}

export default App
