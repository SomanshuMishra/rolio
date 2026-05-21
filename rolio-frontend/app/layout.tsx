import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Space_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import RQProvider from '@/src/providers/QueryProvider'
import './globals.css'

const geist = Geist({ 
  subsets: ["latin"],
  variable: "--font-geist"
});
const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: "--font-geist-mono"
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space"
});

export const metadata: Metadata = {
  title: 'ROLIO - AI-Powered Career Operating System',
  description: 'The future of getting jobs. AI-powered job matching, resume optimization, and career guidance.',
  generator: 'ROLIO',
  keywords: ['AI jobs', 'career', 'resume', 'job matching', 'AI career', 'job search'],
  authors: [{ name: 'ROLIO' }],
  openGraph: {
    title: 'ROLIO - AI-Powered Career Operating System',
    description: 'The future of getting jobs. AI-powered job matching, resume optimization, and career guidance.',
    type: 'website',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#050816',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className={`${geist.variable} ${geistMono.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <RQProvider>
            {children}
            {process.env.NODE_ENV === 'production' && <Analytics />}
          </RQProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
