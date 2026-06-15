'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  )
}

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new link.')
      return
    }
    try {
      setError('')
      await api.post('/auth/reset-password', { token, password: data.password })
      router.push('/login?reset=1')
    } catch {
      setError('This reset link has expired or is invalid. Please request a new one.')
    }
  }

  return (
    <div className="flex min-h-screen">

      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[46%] flex-col justify-between bg-gradient-to-br from-brand-900 via-brand-800 to-violet-900 p-12 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-24 -left-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute inset-0 bg-grid-dark" />
        </div>

        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="text-2xl">🌉</span>
          <span className="text-xl font-bold text-white">TalentBridge</span>
        </Link>

        <div className="relative">
          <blockquote className="text-3xl font-bold leading-snug text-white">
            Choose a strong new password.
          </blockquote>
          <p className="mt-4 text-sm leading-relaxed text-white/50">
            Pick something memorable but hard to guess. We recommend using a passphrase or a password manager.
          </p>

          <div className="mt-10 space-y-3">
            {[
              'At least 8 characters',
              'Mix of letters, numbers & symbols',
              'Different from your last password',
            ].map(tip => (
              <div key={tip} className="flex items-center gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs text-white/70">
                  ✓
                </div>
                <p className="text-sm text-white/60">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/25">© 2026 TalentBridge · JGC Solutions</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col justify-center px-8 py-12 sm:px-12 bg-white">
        <div className="mx-auto w-full max-w-sm">

          {/* Mobile logo */}
          <Link href="/" className="mb-10 flex items-center gap-2 lg:hidden">
            <span className="text-xl">🌉</span>
            <span className="font-bold text-brand-700">TalentBridge</span>
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">Set new password</h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Choose a new password for your account.
          </p>

          {!token && (
            <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
              <span className="mt-0.5 text-amber-500">⚠️</span>
              <div>
                <p className="text-sm font-medium text-amber-800">Invalid reset link</p>
                <p className="mt-0.5 text-xs text-amber-700">
                  This link is missing a token.{' '}
                  <Link href="/forgot-password" className="underline">Request a new one.</Link>
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div>
              <label className="label">New password</label>
              <input
                type="password"
                className="input"
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                {...register('password')}
              />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label">Confirm new password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                autoComplete="new-password"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                <span className="mt-0.5 text-red-500">⚠️</span>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !token}
              className="btn-primary w-full py-3 text-base shadow-lg shadow-brand-600/15 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving…
                </span>
              ) : 'Set new password →'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>

    </div>
  )
}
