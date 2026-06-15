'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getToken, getStoredUser, clearAuth } from '@/lib/auth'
import type { UserRole } from '@/lib/types'

interface UseAuthOptions {
  /** If provided, redirect away if the user doesn't have this role. */
  requiredRole?: UserRole
  /** Where to redirect if not authenticated. Defaults to /login */
  redirectTo?: string
}

/**
 * Client-side auth guard hook.
 * Use in page components as a secondary check (middleware is the primary guard).
 * Handles the edge case where the cookie exists but localStorage was cleared.
 */
export function useAuth(options: UseAuthOptions = {}) {
  const { requiredRole, redirectTo = '/login' } = options
  const router = useRouter()
  const token = getToken()
  const user  = getStoredUser()

  useEffect(() => {
    if (!token || !user) {
      clearAuth()
      router.replace(redirectTo)
      return
    }

    if (requiredRole && user.role !== requiredRole) {
      router.replace(user.role === 'CANDIDATE' ? '/candidate/dashboard' : '/employer/dashboard')
    }
  }, [token, user, requiredRole, redirectTo, router])

  return { user, token, isReady: !!token && !!user }
}
