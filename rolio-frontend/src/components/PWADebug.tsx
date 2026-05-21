'use client'

import { useState, useEffect } from 'react'

export default function PWADebug() {
  const [state, setState] = useState({
    ua: '',
    isIOS: false,
    isAndroid: false,
    isInstalled: false,
    supportsWebApp: false,
    standalone: false,
    maxTouchPoints: 0,
  })

  useEffect(() => {
    const ua = navigator.userAgent
    const isIPad = /iPad/.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua))
    const isIOS = (isIPad || /iPhone|iPod/.test(ua)) && !(window as any).MSStream
    const isAndroid = /Android/.test(ua)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const standalone = (navigator as any).standalone === true
    const supportsWebApp = 'serviceWorker' in navigator && 'caches' in window

    setState({
      ua: ua.substring(0, 80),
      isIOS,
      isAndroid,
      isInstalled: isStandalone || standalone,
      supportsWebApp,
      standalone,
      maxTouchPoints: navigator.maxTouchPoints,
    })
  }, [])

  return (
    <div className="fixed top-4 left-4 z-[9999] bg-black/90 text-white text-[10px] p-4 rounded max-w-sm font-mono space-y-1 pointer-events-auto">
      <div className="font-bold text-xs mb-2 border-b border-white/20 pb-2">PWA DEBUG</div>
      <div><span className="text-cyan-400">UA:</span> {state.ua}...</div>
      <div><span className="text-cyan-400">iOS:</span> {state.isIOS ? '✓ YES' : '✗ NO'}</div>
      <div><span className="text-cyan-400">Android:</span> {state.isAndroid ? '✓ YES' : '✗ NO'}</div>
      <div><span className="text-cyan-400">Installed:</span> {state.isInstalled ? '✓ YES' : '✗ NO'}</div>
      <div><span className="text-cyan-400">Standalone:</span> {state.standalone ? '✓ YES' : '✗ NO'}</div>
      <div><span className="text-cyan-400">TouchPoints:</span> {state.maxTouchPoints}</div>
      <div><span className="text-cyan-400">WebApp:</span> {state.supportsWebApp ? '✓ YES' : '✗ NO'}</div>
      <div className="text-yellow-400 text-[9px] mt-2 pt-2 border-t border-white/20">
        Remove after debug
      </div>
    </div>
  )
}
