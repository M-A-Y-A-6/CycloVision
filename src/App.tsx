import { AnimatePresence } from 'framer-motion'
import { StoryScreen } from './components/StoryScreen'
import { TopBar } from './components/TopBar'
import { Landing } from './stages/Landing'
import { useStory } from './store/story'

function App() {
  const stage = useStory((s) => s.stage)

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      {/* "wait": one screen finishes leaving before the next one comes in (Landing zoom-out, or the story fade-out on Replay). */}
      <AnimatePresence mode="wait">
        {stage === 'idle' ? <Landing key="landing" /> : <StoryScreen key="story" />}
      </AnimatePresence>
    </div>
  )
}

export default App
