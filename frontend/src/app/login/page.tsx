'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { saveAuth } from '@/lib/auth'
import type { AuthResponse } from '@/lib/types'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromPath = searchParams.get('from')
  const passwordReset = searchParams.get('reset') === '1'
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      setError('')
      const res = await api.post<AuthResponse>('/auth/login', data)
      saveAuth(res.data)
      const defaultDest = res.data.role === 'CANDIDATE' ? '/candidate/explore' : '/employer/dashboard'
      router.push(fromPath ?? defaultDest)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 401) {
        setError('Invalid email or password.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    }
  }

  return (
    <div className="flex min-h-screen">

      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[46%] flex-col justify-between bg-gradient-to-br from-brand-900 via-brand-800 to-violet-900 p-12 relative overflow-hidden">
        {/* Decorative */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-24 -left-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute inset-0 bg-grid-dark" />
        </div>

        {/* Logo */}
        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="text-2xl">🌉</span>
          <span className="text-xl font-bold text-white">TalentBridge</span>
        </Link>

        {/* Quote & mock card */}
        <div className="relative">
          <blockquote className="text-3xl font-bold leading-snug text-white">
            Know exactly where you stand before you apply.
          </blockquote>
          <p className="mt-4 text-sm leading-relaxed text-white/50">
            AI-powered gap analysis built on O*NET industry standards. Upload once, match everywhere.
          </p>

          {/* Mock score card */}
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40">Latest analysis</p>
                <p className="font-semibold text-white">Software Engineer III</p>
              </div>
              <span className="text-2xl font-extrabold text-green-400">87%</span>
            </div>
            <div className="space-y-2.5">
              {[{ l: 'Technical Skills', v: 92 }, { l: 'Experience', v: 78 }, { l: 'Education', v: 95 }].map(x => (
                <div key={x.l}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-white/50">{x.l}</span>
                    <span className="font-medium text-white/80">{x.v}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-violet-400" style={{ width: `${x.v}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="relative text-xs text-white/25">© 2026 TalentBridge · JGC Solutions</p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col justify-center px-8 py-12 sm:px-12 bg-white">
        <div className="mx-auto w-full max-w-sm">

          {/* Mobile logo */}
          <Link href="/" className="mb-10 flex items-center gap-2 lg:hidden">
            <span className="text-xl">🌉</span>
            <span className="font-bold text-brand-700">TalentBridge</span>
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-1.5 text-sm text-gray-500">Sign in to continue to your dashboard</p>

          {passwordReset && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-green-50 border border-green-100 px-4 py-3">
              <span className="mt-0.5 text-green-500">✓</span>
              <p className="text-sm text-green-700">Password updated successfully. Sign in with your new password.</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div>
              <label className="label">Email address</label>
              <input type="email" className="input" placeholder="you@example.com" {...register('email')} />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="label">Password</label>
                <Link href="/forgot-password" className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input type="password" className="input" placeholder="••••••••" {...register('password')} />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                <span className="mt-0.5 text-red-500">⚠️</span>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 text-base shadow-lg shadow-brand-600/15">
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in…
                </span>
              ) : 'Sign in →'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}
