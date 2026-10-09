import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Checkbox } from '../components/ui/Checkbox'
import { PageHeader } from '../components/common/PageHeader'
import { useAuth } from '../context/AuthContext'
import { useMutation } from '../hooks/useMutation'

const EMPTY = {
  displayName: '',
  username: '',
  email: '',
  password: '',
  isArtist: false,
}

export function RegisterPage() {
  const { signUp, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    if (isAuthenticated) navigate('/onboarding', { replace: true })
  }, [isAuthenticated, navigate])

  const { mutate, pending, error } = useMutation(signUp, {
    successMessage: 'Account created.',

    onSuccess: () => navigate('/onboarding', { replace: true }),
  })

  const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }))

  const fieldError = (name) =>
    error?.errors?.find((e) => String(e.field).endsWith(name))?.message ??
    (error?.code === `${name}_taken` ? error.userMessage : undefined)

  return (
    <div className="shell max-w-md py-12 sm:py-16">
      <PageHeader eyebrow="Join the board" title="Create an account" />

      <form
        className="mt-8 space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          mutate(form)
        }}
      >
        <Input
          label="Display name"
          required
          value={form.displayName}
          onChange={set('displayName')}
          error={fieldError('display_name')}
        />
        <Input
          label="Username"
          required
          value={form.username}
          onChange={set('username')}
          hint="3–30 characters: letters, numbers and underscores."
          error={fieldError('username')}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={set('email')}
          error={fieldError('email')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={set('password')}
          hint="At least 8 characters."
          error={fieldError('password')}
        />

        <div className="rounded-card border border-border bg-surface p-3">
          <Checkbox
            label="I want to post a commission sheet"
            description="Creates an artist profile you can fill in from the dashboard. You can do this later instead."
            checked={form.isArtist}
            onChange={(checked) => setForm((f) => ({ ...f, isArtist: checked }))}
          />
        </div>

        <Button type="submit" fullWidth size="lg" disabled={pending}>
          {pending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-small text-text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-accent underline underline-offset-2">
          Log in
        </Link>
      </p>
    </div>
  )
}

export default RegisterPage
