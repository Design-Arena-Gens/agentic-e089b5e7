import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Grok Video Automation',
  description: 'Automate video creation with Grok AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
