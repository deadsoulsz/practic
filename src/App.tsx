import { useEffect, useState } from 'react'
import { useAuthStore } from './store/authStore'
import { AuthLayout } from './components/auth/AuthLayout'
import { Layout } from './components/layout/Layout'
import { Events } from './components/events/Events'
import { Network } from './components/network/Network'
import { Messages } from './components/messages/Messages'
import { Profile } from './components/profile/Profile'
import { Toaster } from './components/ui/toaster'

function App() {
  const { user, loading, initialize } = useAuthStore()
  const [currentTab, setCurrentTab] = useState('events')

  useEffect(() => {
    initialize()
  }, [initialize])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <AuthLayout />
        <Toaster />
      </>
    )
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'events':
        return <Events />
      case 'network':
        return <Network />
      case 'messages':
        return <Messages />
      case 'profile':
        return <Profile />
      default:
        return <Events />
    }
  }

  return (
    <>
      <Layout currentTab={currentTab} onTabChange={setCurrentTab}>
        {renderContent()}
      </Layout>
      <Toaster />
    </>
  )
}

export default App
