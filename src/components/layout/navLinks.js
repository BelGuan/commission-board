import { Compass, LayoutDashboard, Settings, Sparkles } from 'lucide-react'

export const NAV_LINKS = [
  { to: '/', label: 'Feed', icon: Sparkles, end: true },
  { to: '/browse', label: 'Browse', icon: Compass },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default NAV_LINKS
