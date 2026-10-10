import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { MatureContentProvider } from './context/MatureContentContext'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { AppShell } from './components/layout/AppShell'
import { FeedPage } from './pages/FeedPage'
import { BrowsePage } from './pages/BrowsePage'
import { ArtistProfilePage } from './pages/ArtistProfilePage'
import { UserProfilePage } from './pages/UserProfilePage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { SettingsPage } from './pages/SettingsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { listTags } from './api/client'
import { hydrateVocabulary } from './data/constants'

function useVocabulary() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    listTags()
      .then((payload) => !cancelled && hydrateVocabulary(payload))
      .catch(() => {

      })
      .finally(() => !cancelled && setReady(true))
    return () => {
      cancelled = true
    }
  }, [])

  return ready
}

function AppRoutes() {
  const ready = useVocabulary()

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-small text-text-muted">Loading Commission Board…</span>
      </div>
    )
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<FeedPage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/artist/:handle" element={<ArtistProfilePage />} />
        <Route path="/u/:username" element={<UserProfilePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <MatureContentProvider>
            <AppRoutes />
          </MatureContentProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
