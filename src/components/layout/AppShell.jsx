import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { TopNav } from './TopNav'
import { Footer } from './Footer'

export function AppShell() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:shadow-lift"
      >
        Skip to content
      </a>

      <TopNav />

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}

export default AppShell
