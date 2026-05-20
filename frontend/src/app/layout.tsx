import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/Toast'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://rolio.in'),
  title: {
    default: 'Rolio – AI-Powered Job Matching for Tech Roles',
    template: '%s | Rolio',
  },
  description: 'Rolio uses AI to match your resume with the best tech roles. Upload your resume, set preferences, and let AI find your perfect software engineering, product, and design opportunities.',
  keywords: [
    'job matching',
    'AI jobs',
    'tech jobs',
    'software engineer jobs',
    'resume matching',
    'career AI',
    'job search',
    'tech careers',
    'AI career matching',
    'job recommendations',
  ],
  authors: [{ name: 'Rolio' }],
  creator: 'Rolio',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://rolio.in',
    siteName: 'Rolio',
    title: 'Rolio – AI-Powered Job Matching for Tech Roles',
    description: 'Upload your resume, set preferences, and let AI surface the best tech opportunities for you.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Rolio - AI Job Matching Platform',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rolio – AI-Powered Job Matching',
    description: 'Upload your resume, let AI find your perfect tech job.',
    images: ['/og-image.png'],
    creator: '@rolio_in',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="bg-[#f8f7ff] text-[#0f172a] font-body">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
