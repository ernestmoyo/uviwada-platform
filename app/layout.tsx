import type { Metadata } from 'next'

import './globals.css'

import { I18nProvider } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'UVIWADA — Umoja wa Vituo vya Watoto wa Dar es Salaam',
  description:
    'UVIWADA digital platform connecting, supporting and elevating daycare centres in Dar es Salaam in partnership with Children in Crossfire.',
  icons: {
    icon: '/logo.svg'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sw">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  )
}
