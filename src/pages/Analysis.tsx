import { Navigate } from 'react-router-dom'
import { StoryScreen } from '../components/StoryScreen'
import { useStory } from '../store/story'

/**
 * Analysis ("/analysis"): the story, unchanged from before routing was added (components/StoryScreen.tsx).
 * The only way to reach here with a storm to run is Dashboard's "Simulate Cyclone" button, which generates
 * the storm and sets `stage` to `detect` in one atomic step (`beginSimulation`, store/story.ts). If there is
 * no current storm — a direct or stale visit — this page redirects back to Dashboard instead of guessing one.
 */
export function Analysis() {
  const currentCase = useStory((s) => s.currentCase)
  if (!currentCase) return <Navigate to="/" replace />
  return <StoryScreen />
}
