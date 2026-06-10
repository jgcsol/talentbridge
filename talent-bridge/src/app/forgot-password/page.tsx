'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'

const schema = z.object({
  email: z.string().email('Invalid email address'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await api.post('/auth/forgot-password', { email: data.email })
    } catch {
      // Silently succeed regardless — never reveal whether an email exists
    }
    setSubmittedEmail(data.email)
    setSubmitted(true)
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
            We&apos;ll get you back on track.
          </blockquote>
          <p className="mt-4 text-sm leading-relaxed text-white/50">
            Enter your email and we&apos;ll send a secure link to reset your password. The link expires in 30 minutes.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { icon: '🔒', text: 'Secure, time-limited reset link' },
              { icon: '📬', text: 'Sent to your registered email only' },
              { icon: '✅', text: 'No account details revealed' },
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

      {/* Right panel */}
      <div className="flex flex-1 flex-col justify-center px-8 py-12 sm:px-12 bg-white">
        <div className="mx-auto w-full max-w-sm">

          {/* Mobile logo */}
          <Link href="/" className="mb-10 flex items-center gap-2 lg:hidden">
            <span className="text-xl">🌉</span>
            <span className="font-bold text-brand-700">TalentBridge</span>
          </Link>

          {submitted ? (
            /* Success state */
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl">
                📬
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Check your inbox</h1>
              <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                If <span className="font-medium text-gray-700">{submittedEmail}</span> is registered, you&apos;ll receive a reset link shortly. Check your spam folder if you don&apos;t see it.
              </p>
              <Link
                href="/login"
                className="mt-8 inline-flex items-center justify-center gap-2 btn-primary w-full py-3 text-base"
              >
                ← Back to sign in
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
              <p className="mt-1.5 text-sm text-gray-500">
                Enter your email and we&apos;ll send a reset link.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
                <div>
                  <label className="label">Email address</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="you@example.com"
                    autoComplete="email"
                    {...register('email')}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full py-3 text-base shadow-lg shadow-brand-600/15"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Sending…
                    </span>
                  ) : 'Send reset link →'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                  ← Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  )
}
