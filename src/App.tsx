import { Navigate, Route, Routes } from 'react-router-dom'
import { useStore } from '@/lib/store'
import { useIdentityTheme } from '@/lib/theme'
import { AppShell } from '@/components/AppShell'
import Landing from '@/pages/Landing'
import Auth from '@/pages/Auth'
import Onboarding from '@/pages/Onboarding'
import Dashboard from '@/pages/Dashboard'
import Identity from '@/pages/Identity'
import Quests from '@/pages/Quests'
import BossBattle from '@/pages/BossBattle'
import Achievements from '@/pages/Achievements'
import ShareCreator from '@/pages/ShareCreator'
import Profile from '@/pages/Profile'

export default function App() {
  useIdentityTheme()
  const user = useStore((s) => s.user)
  const profile = useStore((s) => s.profile)

  return (
    <Routes>
      <Route path="/" element={user && profile ? <Navigate to="/app" replace /> : <Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/onboarding" element={user ? <Onboarding /> : <Navigate to="/auth" replace />} />

      <Route path="/app" element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="identity" element={<Identity />} />
        <Route path="quests" element={<Quests />} />
        <Route path="boss" element={<BossBattle />} />
        <Route path="achievements" element={<Achievements />} />
        <Route path="share" element={<ShareCreator />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
