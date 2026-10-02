const token = (name) => `hsl(var(--${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: token('background'),
        surface: token('surface'),
        'surface-muted': token('surface-muted'),
        border: token('border'),
        'border-strong': token('border-strong'),
        'text-primary': token('text-primary'),
        'text-muted': token('text-muted'),
        'text-subtle': token('text-subtle'),
        accent: token('accent'),
        'accent-hover': token('accent-hover'),
        'accent-muted': token('accent-muted'),
        'accent-contrast': token('accent-contrast'),
        success: token('success'),
        'success-muted': token('success-muted'),
        warning: token('warning'),
        'warning-muted': token('warning-muted'),
        danger: token('danger'),
        'danger-hover': token('danger-hover'),
        'danger-muted': token('danger-muted'),
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        micro: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.04em' }],
        caption: ['0.75rem', { lineHeight: '1.1rem' }],
        small: ['0.8125rem', { lineHeight: '1.25rem' }],
        body: ['0.9375rem', { lineHeight: '1.5rem' }],
        lead: ['1.0625rem', { lineHeight: '1.7rem' }],
        h4: ['1.125rem', { lineHeight: '1.5rem', letterSpacing: '-0.01em' }],
        h3: ['1.375rem', { lineHeight: '1.75rem', letterSpacing: '-0.015em' }],
        h2: ['1.75rem', { lineHeight: '2.125rem', letterSpacing: '-0.02em' }],
        h1: ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.025em' }],
        display: ['3rem', { lineHeight: '3.125rem', letterSpacing: '-0.03em' }],
      },
      borderRadius: { card: '0.875rem', pill: '999px' },
      boxShadow: {
        card: '0 1px 2px hsl(28 20% 12% / 0.04), 0 8px 24px -12px hsl(28 20% 12% / 0.10)',
        lift: '0 2px 4px hsl(28 20% 12% / 0.05), 0 16px 40px -16px hsl(28 20% 12% / 0.18)',
        overlay: '0 24px 64px -24px hsl(28 20% 12% / 0.35)',
      },
      maxWidth: { shell: '80rem' },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scale-in': {
          from: { opacity: '0', transform: 'translateY(6px) scale(0.985)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 160ms ease-out',
        'scale-in': 'scale-in 180ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slide-in-right 220ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
