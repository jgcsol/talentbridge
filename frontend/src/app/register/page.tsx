'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { saveAuth } from '@/lib/auth'
import type { AuthResponse, UserRole } from '@/lib/types'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['CANDIDATE', 'EMPLOYER']),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  )
}

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = (searchParams.get('role') ?? 'CANDIDATE') as UserRole

  const [error, setError] = useState('')
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: defaultRole },
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: FormData) => {
    try {
      setError('')
      const res = await api.post<AuthResponse>('/auth/register', {
        email: data.email,
        password: data.password,
        role: data.role,
      })
      saveAuth(res.data)
      router.push(res.data.role === 'CANDIDATE' ? '/candidate/dashboard' : '/employer/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg ?? 'Registration failed. Please try again.')
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
            Your career breakthrough starts with one upload.
          </blockquote>
          <p className="mt-4 text-sm leading-relaxed text-white/50">
            Our AI reads your resume and matches you against any occupation using verified O*NET data — showing you exactly what to do next.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { icon: '📄', text: 'Resume parsed automatically in seconds' },
              { icon: '📊', text: 'Detailed gap analysis vs any occupation' },
              { icon: '🎯', text: 'Actionable recommendations to close the gap' },
              { icon: '🔍', text: 'Get discovered by employers actively hiring' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm">
                  {icon}
                </div>
                <p className="text-sm text-white/60">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/25">© 2026 TalentBridge · JGC Solutions</p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col justify-center px-8 py-12 sm:px-12 bg-white overflow-y-auto">
        <div className="mx-auto w-full max-w-sm">

          {/* Mobile logo */}
          <Link href="/" className="mb-10 flex items-center gap-2 lg:hidden">
            <span className="text-xl">🌉</span>
            <span className="font-bold text-brand-700">TalentBridge</span>
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-1.5 text-sm text-gray-500">Free to join — no credit card required.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            {/* Role toggle */}
            <div>
              <label className="label">I am a…</label>
              <div className="grid grid-cols-2 gap-3">
                {(['CANDIDATE', 'EMPLOYER'] as const).map((role) => (
                  <label
                    key={role}
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-4 py-3.5 text-sm font-semibold transition-all ${
                      selectedRole === role
                        ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm shadow-brand-600/10'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input type="radio" value={role} className="sr-only" {...register('role')} />
                    {role === 'CANDIDATE' ? '👤 Job Seeker' : '🏢 Employer'}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Email address</label>
              <input type="email" className="input" placeholder="you@example.com" {...register('email')} />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="Min. 8 characters" {...register('password')} />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <input type="password" className="input" placeholder="••••••••" {...register('confirmPassword')} />
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
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
                  Creating account…
                </span>
              ) : 'Create account →'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>

    </div>
  )
}
