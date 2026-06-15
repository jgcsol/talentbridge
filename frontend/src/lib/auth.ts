import type { AuthResponse, UserRole } from './types'

const TOKEN_KEY    = 'tb_access_token'
const REFRESH_KEY  = 'tb_refresh_token'
const USER_KEY     = 'tb_user'
const COOKIE_NAME  = 'tb_auth'  // read by middleware (non-HttpOnly)

export interface StoredUser {
  userId: string
  email:  string
  role:   UserRole
}

// ── Write ────────────────────────────────────────────────────────────────────

export function saveAuth(data: AuthResponse) {
  localStorage.setItem(TOKEN_KEY,   data.accessToken)
  localStorage.setItem(REFRESH_KEY, data.refreshToken)
  localStorage.setItem(USER_KEY, JSON.stringify({
    userId: data.userId,
    email:  data.email,
    role:   data.role,
  }))
  // Also set a plain cookie so middleware can read it (no HttpOnly — JS-accessible)
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify({
    role: data.role,
  }))}; path=/; max-age=604800; SameSite=Lax`
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
  // Expire the cookie
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`
}

// ── Read ─────────────────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) : null
}

export function isLoggedIn(): boolean {
  return !!getToken()
}
