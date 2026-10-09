import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/common/PageHeader'
import { useAuth } from '../context/AuthContext'
import { useMutation } from '../hooks/useMutation'

export function LoginPage() {
  const { signIn, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })

  const next = location.state?.from ?? '/'

  useEffect(() => {
    if (isAuthenticated) navigate(next, { replace: true })
  }, [isAuthenticated, navigate, next])

  const { mutate, pending, error } = useMutation(signIn, {
    successMessage: 'Signed in.',
    onSuccess: () => navigate(next, { replace: true }),
  })

  const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }))

  return (
    <div className="shell max-w-md py-12 sm:py-16">
      <PageHeader eyebrow="Welcome back" title="Log in" />

      <form
        className="mt-8 space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          mutate(form)
        }}
      >
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={set('email')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={set('password')}

          error={error ? error.userMessage : undefined}
        />

        <Button type="submit" fullWidth size="lg" disabled={pending}>
          {pending ? 'Signing in…' : 'Log in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-small text-text-muted">
        No account yet?{' '}
        <Link to="/register" className="font-medium text-accent underline underline-offset-2">
          Create one
        </Link>
      </p>

      <p className="mt-8 rounded-card border border-border bg-surface-muted/60 p-3 text-caption text-text-muted">
        Seeded accounts use the password <code className="font-semibold">password123</code> — try{' '}
        <code>mira_oku@example.com</code> (artist) or <code>kestrel_dev@example.com</code>{' '}
        (client).
      </p>
    </div>
  )
}

export default LoginPage
