'use client'

import { Suspense } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Nav } from '@/components/layout/Nav'
import { SkillBadge } from '@/components/ui/SkillBadge'
import { ProfileCompleteness } from '@/components/ui/ProfileCompleteness'
import { candidateApi, gapApi } from '@/lib/api'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatDate } from '@/lib/utils'
import type { CandidateProfile, GapAnalysis } from '@/lib/types'

const NAV = [
  { href: '/candidate/dashboard', label: 'Dashboard' },
  { href: '/candidate/profile',   label: 'My Profile' },
  { href: '/candidate/explore',   label: 'Explore Roles' },
]

/**
 * Page shell — this renders immediately (nav is instant), and the
 * data-dependent content suspends behind the skeleton fallback.
 */
export default function CandidateDashboard() {
  const { isReady } = useAuth({ requiredRole: 'CANDIDATE' })

  if (!isReady) return null

  return (
    <Suspense>
      <CandidateDashboardContent />
    </Suspense>
  )
}

/**
 * All the data fetching lives here. useSuspenseQuery throws a promise
 * while pending, which the Suspense boundary above catches and swaps
 * in the skeleton for — no isLoading checks needed in this component.
 */
function CandidateDashboardContent() {
  const { data: profile } = useSuspenseQuery<CandidateProfile>({
    queryKey: ['candidate-profile'],
    queryFn: () => candidateApi.getProfile().then(r => r.data),
  })

  const { data: analyses } = useSuspenseQuery<GapAnalysis[]>({
    queryKey: ['gap-analyses'],
    queryFn: () => gapApi.getHistory().then(r => r.data),
  })

  const topAnalysis = [...analyses].sort((a, b) => b.overallScore - a.overallScore)[0]

  const visibilityLabel =
    profile?.visibility === 'PUBLIC'         ? '🌐 Public' :
    profile?.visibility === 'EMPLOYERS_ONLY' ? '🔒 Employers' :
                                               '👁️ Private'

  return (
    <div className="min-h-screen bg-gray-50/80">
      <Nav links={NAV} />

      <main className="mx-auto max-w-6xl px-6 py-10">

        {/* ── Page header ── */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {profile?.headline ? profile.headline : 'Welcome to TalentBridge 👋'}
            </h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
              {profile?.location && (
                <span className="flex items-center gap-1">
                  <span>📍</span>{profile.location}
                </span>
              )}
              {profile?.profileComplete
                ? <span className="flex items-center gap-1 font-medium text-green-600"><span>✓</span> Profile complete</span>
                : <span>Complete your profile to get discovered by employers</span>}
            </p>
          </div>
          <Link href="/candidate/explore" className="btn-primary shrink-0 hidden sm:flex">
            Explore roles →
          </Link>
        </div>

        {/* ── Stat strip ── */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="card group relative overflow-hidden py-5">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 text-lg shadow-sm shadow-brand-500/20">
                🏆
              </div>
              <div className="min-w-0">
                <p className="section-label">Top Match</p>
                <p className="mt-1 text-2xl font-extrabold text-gray-900">
                  {topAnalysis ? `${topAnalysis.overallScore}%` : '—'}
                </p>
                <p className="mt-0.5 truncate text-xs text-gray-400">
                  {topAnalysis?.occupationTitle ?? 'Run an analysis'}
                </p>
              </div>
            </div>
          </div>

          <div className="card group relative overflow-hidden py-5">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-lg shadow-sm shadow-violet-500/20">
                📊
              </div>
              <div>
                <p className="section-label">Analyses</p>
                <p className="mt-1 text-2xl font-extrabold text-gray-900">{analyses.length}</p>
                <p className="mt-0.5 text-xs text-gray-400">Roles evaluated</p>
              </div>
            </div>
          </div>

          <div className="card group relative overflow-hidden py-5">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/5 to-brand-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-brand-500 text-lg shadow-sm shadow-blue-500/20">
                ⚡
              </div>
              <div>
                <p className="section-label">Skills</p>
                <p className="mt-1 text-2xl font-extrabold text-gray-900">{profile?.skills?.length ?? 0}</p>
                <p className="mt-0.5 text-xs text-gray-400">On your profile</p>
              </div>
            </div>
          </div>

          <div className="card group relative overflow-hidden py-5">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-lg shadow-sm shadow-green-500/20">
                🌐
              </div>
              <div>
                <p className="section-label">Visibility</p>
                <p className="mt-1 text-sm font-bold text-gray-900">{visibilityLabel}</p>
                <p className="mt-0.5 text-xs text-gray-400">Profile status</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* ── Left column ── */}
          <div className="space-y-6">
            <ProfileCompleteness profile={profile} />

            {/* Skills card */}
            <div className="card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="section-label">Skills</h2>
                <Link href="/candidate/profile" className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                  Edit →
                </Link>
              </div>
              {profile?.skills?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.slice(0, 12).map((s) => (
                    <SkillBadge key={s.name} skill={s} />
                  ))}
                  {profile.skills.length > 12 && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                      +{profile.skills.length - 12} more
                    </span>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center">
                  <p className="text-sm font-medium text-gray-400">No skills extracted yet</p>
                  <Link href="/candidate/profile" className="mt-2 block text-xs font-semibold text-brand-600 hover:text-brand-700">
                    Upload resume →
                  </Link>
                </div>
              )}
            </div>

            {/* Experience card */}
            <div className="card">
              <h2 className="section-label mb-4">Experience</h2>
              {profile?.experiences?.length ? (
                <div className="space-y-4">
                  {profile.experiences.slice(0, 3).map((e) => (
                    <div key={e.company + e.title} className="flex gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-50 to-violet-50 text-sm ring-1 ring-gray-100">
                        💼
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{e.title}</p>
                        <p className="truncate text-xs text-gray-500">{e.company}</p>
                        <p className="text-xs text-gray-400">
                          {e.startDate} – {e.current ? 'Present' : e.endDate ?? ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center">
                  <p className="text-sm text-gray-400">No experience yet</p>
                  <Link href="/candidate/profile" className="mt-1 block text-xs font-semibold text-brand-600 hover:text-brand-700">
                    Upload resume →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Best match analysis */}
            {topAnalysis ? (
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="relative overflow-hidden bg-gradient-to-r from-brand-700 via-brand-600 to-violet-700 px-6 py-5">
                  <div className="pointer-events-none absolute inset-0 bg-grid-dark" />
                  <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                  <div className="relative flex items-start justify-between">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm">
                        ⭐ Best Match
                      </span>
                      <h2 className="mt-2 text-xl font-bold text-white">{topAnalysis.occupationTitle}</h2>
                      <p className="mt-0.5 text-xs text-white/50">Analyzed {formatDate(topAnalysis.generatedAt)}</p>
                    </div>
                    <div className={`rounded-2xl px-5 py-2.5 text-center ring-2 ring-white/20 ${
                      topAnalysis.overallScore >= 80 ? 'bg-green-500/20' :
                      topAnalysis.overallScore >= 60 ? 'bg-yellow-500/20' : 'bg-red-500/20'
                    }`}>
                      <p className={`text-3xl font-extrabold ${
                        topAnalysis.overallScore >= 80 ? 'text-green-300' :
                        topAnalysis.overallScore >= 60 ? 'text-yellow-300' : 'text-red-300'
                      }`}>{topAnalysis.overallScore}%</p>
                      <p className="text-xs text-white/50">Overall</p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-5">
                  <div className="mb-5 space-y-3">
                    {[
                      { label: 'Skills',      score: topAnalysis.skillScore,      color: 'from-brand-500 to-violet-500' },
                      { label: 'Experience',  score: topAnalysis.experienceScore,  color: 'from-violet-500 to-pink-500' },
                      { label: 'Education',   score: topAnalysis.educationScore,   color: 'from-blue-500 to-brand-500' },
                    ].map(({ label, score, color }) => (
                      <div key={label}>
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-600">{label}</span>
                          <span className={`text-xs font-bold ${
                            score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>{score}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {topAnalysis.summary && (
                    <p className="mb-4 rounded-xl bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-600 border border-gray-100">
                      {topAnalysis.summary}
                    </p>
                  )}

                  <Link href="/candidate/gap-analysis">
                    <button className="btn-secondary w-full">View full analysis →</button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="card flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-violet-50 text-3xl ring-1 ring-gray-100">
                  🎯
                </div>
                <h2 className="text-lg font-bold text-gray-900">No analyses yet</h2>
                <p className="mt-2 max-w-xs text-sm text-gray-500">
                  Explore occupations and run a gap analysis to see how your skills compare.
                </p>
                <Link href="/candidate/explore" className="btn-primary mt-6">
                  Explore roles →
                </Link>
              </div>
            )}

            {/* All analyses table */}
            {analyses.length > 0 && (
              <div className="card">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="section-label">All Analyses</h2>
                  <Link href="/candidate/gap-analysis" className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                    View all →
                  </Link>
                </div>
                <div className="divide-y divide-gray-100">
                  {analyses.map((a) => (
                    <div key={a.id} className="group flex items-center justify-between gap-4 py-3.5 -mx-6 px-6 hover:bg-gray-50 transition-colors rounded-xl">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{a.occupationTitle}</p>
                        <p className="text-xs text-gray-400">{a.occupationCode} · {formatDate(a.generatedAt)}</p>
                      </div>
                      <div className="ml-4 flex shrink-0 items-center gap-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${
                          a.overallScore >= 80 ? 'bg-green-50 text-green-700 ring-green-200' :
                          a.overallScore >= 60 ? 'bg-yellow-50 text-yellow-700 ring-yellow-200' :
                                                 'bg-red-50 text-red-700 ring-red-200'
                        }`}>
                          {a.overallScore}%
                        </span>
                        <Link href={`/candidate/gap-analysis?id=${a.id}`} className="text-xs font-semibold text-brand-600 hover:text-brand-700 opacity-0 group-hover:opacity-100 transition-opacity">
                          View →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
