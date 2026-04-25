import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1A5FAA',
          light: '#2B7AD4',
          dark: '#0F3D6E'
        },
        accent: {
          DEFAULT: '#D42027',
          light: '#FDE8E9'
        },
        quality: {
          green: '#22c55e',
          amber: '#f59e0b',
          red: '#ef4444'
        },
        bg: {
          alt: '#F5F8FC'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 2px 16px rgba(26,95,170,0.08)',
        lg: '0 8px 32px rgba(26,95,170,0.12)'
      }
    }
  },
  plugins: []
}

export default config
