'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useGoogleSignIn } from '@/src/hooks/useGoogleSignIn'
import { toast } from 'sonner'

export default function GoogleSignInButton() {
  const router = useRouter()
  const { signIn, isLoading, error } = useGoogleSignIn()
  const [isLocalLoading, setIsLocalLoading] = useState(false)

  const handleClick = async () => {
    setIsLocalLoading(true)
    try {
      await signIn()
      // Sign-in successful, auth store will handle redirect via useEffect in layout
      router.push('/dashboard')
    } catch (err: any) {
      const errorMsg = error || err.message || 'Sign-in failed'
      toast.error(errorMsg)
      console.error('Sign-in error:', err)
    } finally {
      setIsLocalLoading(false)
    }
  }

  const isLoading_state = isLoading || isLocalLoading

  return (
    <button
      onClick={handleClick}
      disabled={isLoading_state}
      className="w-full flex items-center justify-center gap-3 rounded-lg border border-border bg-card/50 px-4 py-3 font-medium text-foreground transition-all hover:bg-card disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isLoading_state ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Signing in...
        </>
      ) : (
        <>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M22 12c0-5.5-4.5-10-10-10S2 6.5 2 12c0 4.9 3.6 9 8.3 9.8V15h-2.5V12h2.5V9.6c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 3h-2.4v6.8C18.4 21 22 16.9 22 12z" />
          </svg>
          Continue with Google
        </>
      )}
    </button>
  )
}
