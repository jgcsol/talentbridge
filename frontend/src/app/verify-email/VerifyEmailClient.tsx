"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

export default function VerifyEmailClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying your email...')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('Missing verification token.')
      return
    }

    api.post('/auth/verify-email', { token })
      .then(() => {
        setStatus('success')
        setMessage('Your email has been verified successfully.')
        setTimeout(() => router.push('/login'), 2000)
      })
      .catch(() => {
        setStatus('error')
        setMessage('The verification link is invalid or has expired.')
      })
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-2xl">
            {status === 'success' ? '✓' : status === 'error' ? '!' : '✉️'}
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-gray-900">Email verification</h1>
          <p className="mt-3 text-sm text-gray-600">{message}</p>
          <Link href="/login" className="mt-6 inline-flex text-sm font-semibold text-brand-600 hover:text-brand-700">
            Go to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
