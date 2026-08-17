import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'
import { Providers } from '@/components/providers'

export const metadata: Metadata = {
  title: {
    template: '%s — Orazen SEO',
    default: 'Orazen SEO',
  },
  description: 'Orazen SEO is an AI-powered SEO content platform, deployed and supported by Orazen.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  )
}
