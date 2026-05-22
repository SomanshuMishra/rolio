'use client'

import { useState } from 'react'
import { signInWithPopup, UserCredential } from 'firebase/auth'
import { auth, googleProvider } from '@/src/lib/firebase'
import { useAuthStore } from '@/src/store/authStore'
import { profileAPI } from '@/lib/api'

export function useGoogleSignIn() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { loginWithGoogle } = useAuthStore()

  const signIn = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Sign in with Google using Firebase
      const result: UserCredential = await signInWithPopup(auth, googleProvider)

      // Get the ID token from Firebase
      const idToken = await result.user.getIdToken()

      // Call backend with the ID token
      await loginWithGoogle(idToken)

      return result.user
    } catch (err: any) {
      const errorMsg = err.message || 'Google sign-in failed'
      setError(errorMsg)
      console.error('Google sign-in error:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    signIn,
    isLoading,
    error,
  }
}
