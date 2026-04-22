import { useEffect } from 'react'
import { AppRouter } from './app/router'
import { useAuthStore } from './store/useAuthStore'

function App() {
  const initialize = useAuthStore((state) => state.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return <AppRouter />
}

export default App