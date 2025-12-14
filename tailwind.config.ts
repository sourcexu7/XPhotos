import type { Config } from 'tailwindcss'

export default {
  theme: {
    extend: {
      borderRadius: {
        'tremor-small': 'calc(var(--radius) - 4px)',
        'tremor-full': '9999px',
      },
      fontSize: {
        'tremor-label': '0.75rem',
      },
    },
  },
} satisfies Config
