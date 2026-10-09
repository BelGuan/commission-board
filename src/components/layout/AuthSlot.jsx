import { Link, NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Button } from '../ui/Button'
import { Avatar } from '../ui/Avatar'
import { useAuth } from '../../context/AuthContext'

export function AuthSlot({ onNavigate }) {
  const { user, loading, signOut } = useAuth()

  if (loading) return <div className="h-8 w-24 animate-pulse rounded-lg bg-surface-muted" />

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button as={NavLink} to="/login" variant="ghost" size="sm" onClick={onNavigate}>
          Log in
        </Button>
        <Button as={NavLink} to="/register" size="sm" onClick={onNavigate}>
          Sign up
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        to={user.artistProfile ? `/artist/${user.artistProfile.handle}` : `/u/${user.username}`}
        onClick={onNavigate}
        className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-surface-muted"
        title={`Signed in as ${user.displayName}`}
      >
        <Avatar src={user.avatarUrl} name={user.displayName} size="sm" />
        <span className="hidden max-w-[9rem] truncate text-small font-medium lg:block">
          {user.displayName}
        </span>
      </Link>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          onNavigate?.()
          signOut()
        }}
        aria-label="Log out"
        title="Log out"
      >
        <LogOut size={16} />
      </Button>
    </div>
  )
}

export default AuthSlot
