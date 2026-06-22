import type { Metadata, Viewport } from 'next'

import './globals.css'

import { I18nProvider } from '@/lib/i18n'
import { PWARegister } from '@/components/PWARegister'

export const metadata: Metadata = {
  title: 'UVIWATA — Daycare Quality Platform',
  description:
    'UVIWATA digital platform connecting, supporting and elevating daycare centres in Tanzania in partnership with Children in Crossfire.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/uviwata_logo.png',
    apple: '/main_logo.png'
  }
}

export const viewport: Viewport = {
  themeColor: '#1A5FAA'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/leaflet.css" />
      </head>
      <body>
        <I18nProvider>{children}</I18nProvider>
        <PWARegister />
      </body>
    </html>
  )
}
