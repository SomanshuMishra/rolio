// Demo mode for users without API keys

export const DEMO_MODE_ENABLED = true

export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('demo_mode') === 'true' || DEMO_MODE_ENABLED
}

export function enableDemoMode() {
  localStorage.setItem('demo_mode', 'true')
}

export function disableDemoMode() {
  localStorage.setItem('demo_mode', 'false')
}
