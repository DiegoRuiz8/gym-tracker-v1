import { useEffect } from 'react'
import { AppRouter } from './app/router'
import { WorkoutNotificationController } from './components/WorkoutNotificationController'
import { useAuthStore } from './store/useAuthStore'
import { useAppStore } from './store/useAppStore'

function App() {
  const initialize = useAuthStore((state) => state.initialize)
  const isDemo = useAuthStore((state) => state.isDemo)
  const retrySync = useAppStore((state) => state.retrySync)
  const setSyncStatus = useAppStore((state) => state.setSyncStatus)

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    const handleOnline = () => {
      if (isDemo) {
        setSyncStatus('saved')
        return
      }

      void retrySync()
    }
    const handleOffline = () => {
      setSyncStatus(
        'offline',
        'You are offline. Changes are saved on this device.',
      )
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isDemo, retrySync, setSyncStatus])

  return (
    <>
      <WorkoutNotificationController />
      <AppRouter />
    </>
  )
}

export default App
