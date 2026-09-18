import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

/**
 * MemorialCode design system — "Organic & Earthy / Archival".
 * High-contrast for sunlight reading at a grave site; no generic SaaS gloss.
 */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: { '2xl': '1200px' },
    },
    extend: {
      colors: {
        bone: '#FDFBF7',
        surface: '#FFFFFF',
        primary: {
          DEFAULT: '#1B2A26',
          hover: '#2C403B',
        },
        secondary: '#E4DFD6',
        ink: {
          DEFAULT: '#1A1A1C',
          muted: '#5C5C5A',
        },
        line: '#E5E1DA',
        moss: {
          DEFAULT: '#5C6B57',
          soft: '#8A9783',
        },
        clay: '#B08968',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'Cambria', 'serif'],
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['clamp(2.75rem, 6vw, 5rem)', { lineHeight: '1.05' }],
        'display-lg': ['clamp(2.25rem, 4.5vw, 3.5rem)', { lineHeight: '1.1' }],
        'display-md': ['clamp(1.75rem, 3vw, 2.5rem)', { lineHeight: '1.15' }],
      },
      // Admin UI keeps radii at 8px or smaller; public pages use custom arches.
      borderRadius: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '6px',
        md: '6px',
        lg: '8px',
        xl: '8px',
        '2xl': '8px',
      },
      boxShadow: {
        none: 'none',
        subtle: '0 1px 2px rgba(26, 26, 28, 0.04)',
      },
      letterSpacing: {
        widest2: '0.18em',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 420ms ease-out both',
      },
    },
  },
  plugins: [animate],
} satisfies Config
