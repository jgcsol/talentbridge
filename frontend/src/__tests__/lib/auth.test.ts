import { saveAuth, clearAuth, getToken, getStoredUser, isLoggedIn } from '@/lib/auth'
import type { AuthResponse } from '@/lib/types'

const mockAuthResponse: AuthResponse = {
  accessToken: 'access-token-123',
  refreshToken: 'refresh-token-456',
  userId: 'user-uuid-789',
  email: 'test@example.com',
  role: 'CANDIDATE',
}

beforeEach(() => {
  localStorage.clear()
  // Reset document.cookie by expiring any existing cookie
  Object.defineProperty(document, 'cookie', {
    writable: true,
    value: '',
  })
})

describe('saveAuth', () => {
  it('stores access token under tb_access_token', () => {
    saveAuth(mockAuthResponse)
    expect(localStorage.getItem('tb_access_token')).toBe('access-token-123')
  })

  it('stores refresh token under tb_refresh_token', () => {
    saveAuth(mockAuthResponse)
    expect(localStorage.getItem('tb_refresh_token')).toBe('refresh-token-456')
  })

  it('stores user JSON under tb_user', () => {
    saveAuth(mockAuthResponse)
    const user = JSON.parse(localStorage.getItem('tb_user') ?? 'null')
    expect(user).toEqual({
      userId: 'user-uuid-789',
      email: 'test@example.com',
      role: 'CANDIDATE',
    })
  })
})

describe('clearAuth', () => {
  it('removes all stored keys', () => {
    saveAuth(mockAuthResponse)
    clearAuth()
    expect(localStorage.getItem('tb_access_token')).toBeNull()
    expect(localStorage.getItem('tb_refresh_token')).toBeNull()
    expect(localStorage.getItem('tb_user')).toBeNull()
  })
})

describe('getToken', () => {
  it('returns null when nothing is stored', () => {
    expect(getToken()).toBeNull()
  })

  it('returns access token after saveAuth', () => {
    saveAuth(mockAuthResponse)
    expect(getToken()).toBe('access-token-123')
  })

  it('returns null after clearAuth', () => {
    saveAuth(mockAuthResponse)
    clearAuth()
    expect(getToken()).toBeNull()
  })
})

describe('getStoredUser', () => {
  it('returns null when nothing is stored', () => {
    expect(getStoredUser()).toBeNull()
  })

  it('returns parsed user after saveAuth', () => {
    saveAuth(mockAuthResponse)
    expect(getStoredUser()).toEqual({
      userId: 'user-uuid-789',
      email: 'test@example.com',
      role: 'CANDIDATE',
    })
  })
})

describe('isLoggedIn', () => {
  it('returns false when no token stored', () => {
    expect(isLoggedIn()).toBe(false)
  })

  it('returns true after saveAuth', () => {
    saveAuth(mockAuthResponse)
    expect(isLoggedIn()).toBe(true)
  })

  it('returns false after clearAuth', () => {
    saveAuth(mockAuthResponse)
    clearAuth()
    expect(isLoggedIn()).toBe(false)
  })
})
