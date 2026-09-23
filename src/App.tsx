import { AnimatePresence } from 'framer-motion'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { TopBar } from './components/TopBar'
import { AboutPage } from './pages/AboutPage'
import { Analysis } from './pages/Analysis'
import { Dashboard } from './pages/Dashboard'
import { ResultsPanel } from './pages/ResultsPanel'

/**
 * The routed pages, cross-faded on navigation the same way Landing and the story used to cross-fade before
 * routing was added: keyed by the route path, "wait" so one page finishes leaving before the next comes in.
 */
function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/results" element={<ResultsPanel />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  return (
    <HashRouter>
      <div className="flex min-h-screen flex-col">
        <TopBar />
        <AnimatedRoutes />
      </div>
    </HashRouter>
  )
}

export default App
