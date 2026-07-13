'use client'

import { Suspense, useState } from 'react'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { Nav } from '@/components/layout/Nav'
import { employerApi } from '@/lib/api'
import { useAuth } from '@/lib/hooks/useAuth'
import type { EmployerProfile } from '@/lib/types'

const NAV = [
  { href: '/employer/dashboard', label: 'Dashboard' },
  { href: '/employer/search',    label: 'Search Candidates' },
]

/**
 * Page shell — nav renders instantly; the profile-dependent content
 * suspends behind the skeleton fallback until the query resolves.
 */
export default function EmployerDashboard() {
  const { isReady } = useAuth({ requiredRole: 'EMPLOYER' })

  if (!isReady) return null

  return (
    <Suspense>
      <EmployerDashboardContent />
    </Suspense>
  )
}

function EmployerDashboardContent() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)

  const { data: profile } = useSuspenseQuery<EmployerProfile>({
    queryKey: ['employer-profile'],
    queryFn: () => employerApi.getProfile().then(r => r.data),
  })

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<EmployerProfile>({
    values: profile,
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<EmployerProfile>) => employerApi.updateProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employer-profile'] })
      setEditing(false)
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav links={NAV} />

      <main className="mx-auto max-w-3xl px-6 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {profile.companyName ?? 'Company Dashboard'}
          </h1>
          <Link href="/employer/search" className="btn-primary">
            🔍 Search Candidates
          </Link>
        </div>

        {/* Onboarding banner */}
        {!profile.companyName && (
          <div className="card bg-brand-50 border-brand-200">
            <h2 className="font-semibold text-brand-900">Complete your company profile</h2>
            <p className="text-sm text-brand-700 mt-1">
              Candidates can see who&aposs viewing their profiles. A complete company profile builds trust.
            </p>
          </div>
        )}

        {/* Company Profile */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-gray-900">Company Profile</h2>
            {!editing && (
              <button onClick={() => setEditing(true)} className="btn-secondary text-sm">
                Edit
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Company Name</label>
                  <input className="input" placeholder="Acme Corp" {...register('companyName')} />
                </div>
                <div>
                  <label className="label">Industry</label>
                  <input className="input" placeholder="Technology" {...register('industry')} />
                </div>
                <div>
                  <label className="label">Company Size</label>
                  <select className="input" {...register('companySize')}>
                    <option value="">Select…</option>
                    <option>1–10</option>
                    <option>11–50</option>
                    <option>51–200</option>
                    <option>201–1000</option>
                    <option>1000+</option>
                  </select>
                </div>
                <div>
                  <label className="label">Location</label>
                  <input className="input" placeholder="New York, NY" {...register('location')} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Website</label>
                  <input className="input" placeholder="https://company.com" {...register('website')} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Description</label>
                  <textarea
                    className="input min-h-[100px] resize-y"
                    placeholder="What does your company do?"
                    {...register('description')}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2 text-sm">
              {[
                ['Company', profile.companyName],
                ['Industry', profile.industry],
                ['Size', profile.companySize],
                ['Location', profile.location],
                ['Website', profile.website],
              ].map(([label, value]) => value ? (
                <div key={label as string}>
                  <dt className="text-gray-400 text-xs uppercase tracking-wide">{label}</dt>
                  <dd className="mt-0.5 font-medium text-gray-900">{value}</dd>
                </div>
              ) : null)}
              {profile.description && (
                <div className="sm:col-span-2">
                  <dt className="text-gray-400 text-xs uppercase tracking-wide">About</dt>
                  <dd className="mt-0.5 text-gray-700">{profile.description}</dd>
                </div>
              )}
            </dl>
          )}
        </div>

        {/* Quick link */}
        <div className="card bg-gray-900 text-white flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Ready to find talent?</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Browse candidates by role, skills, and AI match score.
            </p>
          </div>
          <Link href="/employer/search" className="btn-primary bg-brand-500 hover:bg-brand-400 shrink-0">
            Search now →
          </Link>
        </div>
      </main>
    </div>
  )
}
