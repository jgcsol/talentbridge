'use client'

import { Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Nav } from '@/components/layout/Nav'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { gapApi } from '@/lib/api'
import { useAuth } from '@/lib/hooks/useAuth'
import { severityColor, scoreBg, formatDate } from '@/lib/utils'
import type { GapAnalysis } from '@/lib/types'

const NAV = [
  { href: '/candidate/dashboard', label: 'Dashboard' },
  { href: '/candidate/profile',   label: 'My Profile' },
  { href: '/candidate/explore',   label: 'Explore Roles' },
]

const REC_CONFIGS: Record<string, { icon: string; color: string; bg: string }> = {
  TRAINING:      { icon: '📚', color: 'text-blue-700',   bg: 'bg-blue-50   border-blue-100' },
  CERTIFICATION: { icon: '🏅', color: 'text-amber-700',  bg: 'bg-amber-50  border-amber-100' },
  EXPERIENCE:    { icon: '💼', color: 'text-violet-700', bg: 'bg-violet-50 border-violet-100' },
  EDUCATION:     { icon: '🎓', color: 'text-green-700',  bg: 'bg-green-50  border-green-100' },
}

export default function GapAnalysisPage() {
  return (
    <Suspense>
      <GapAnalysisContent />
    </Suspense>
  )
}

function GapAnalysisContent() {
  const { isReady } = useAuth({ requiredRole: 'CANDIDATE' })
  const params = useSearchParams()
  const targetId = params.get('id')

  const { data: analyses, isLoading } = useQuery<GapAnalysis[]>({
    queryKey: ['gap-analyses'],
    queryFn: () => gapApi.getHistory().then(r => r.data),
  })

  const selected = targetId
    ? analyses?.find(a => a.id === targetId)
    : analyses?.sort((a, b) => b.overallScore - a.overallScore)[0]

  if (!isReady || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Nav links={NAV} />
        <div className="flex flex-col items-center justify-center gap-3 py-40">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-brand-100 border-t-brand-600" />
          <p className="text-sm text-gray-400 animate-pulse">Loading analyses…</p>
        </div>
      </div>
    )
  }

  if (!analyses || analyses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Nav links={NAV} />
        <div className="flex flex-col items-center justify-center gap-4 py-40 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-violet-50 text-3xl ring-1 ring-gray-100">
            📊
          </div>
          <h1 className="text-xl font-bold text-gray-900">No analyses yet</h1>
          <p className="max-w-xs text-sm text-gray-500">Explore roles and analyze your fit to see detailed results here.</p>
          <Link href="/candidate/explore" className="btn-primary">Explore Roles →</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav links={NAV} />

      <main className="mx-auto max-w-5xl px-6 py-10">

        {/* Page header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gap Analysis</h1>
            <p className="mt-1 text-sm text-gray-500">{analyses.length} role{analyses.length !== 1 ? 's' : ''} analyzed</p>
          </div>
          <Link href="/candidate/explore" className="btn-secondary text-sm">
            + Analyze another role
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">

          {/* Sidebar: analysis list */}
          <div className="lg:col-span-1 space-y-2">
            {analyses.map((a) => (
              <Link
                key={a.id}
                href={`/candidate/gap-analysis?id=${a.id}`}
                className={`block rounded-xl border-2 p-3 transition-all duration-150 ${
                  selected?.id === a.id
                    ? 'border-brand-500 bg-brand-50 shadow-sm shadow-brand-500/10'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-snug">
                  {a.occupationTitle}
                </p>
                <div className="mt-1.5 flex items-center justify-between gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ring-1 ${
                    a.overallScore >= 80 ? 'bg-green-50 text-green-700 ring-green-200' :
                    a.overallScore >= 60 ? 'bg-yellow-50 text-yellow-700 ring-yellow-200' :
                                           'bg-red-50 text-red-700 ring-red-200'
                  }`}>
                    {a.overallScore}%
                  </span>
                  <span className="text-[10px] text-gray-400 shrink-0">{formatDate(a.generatedAt)}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Main: analysis detail */}
          {selected && (
            <div className="lg:col-span-3 space-y-5">

              {/* Score overview — dark gradient header */}
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="relative overflow-hidden bg-gradient-to-br from-[#07071a] via-brand-900 to-violet-950 px-7 py-8">
                  <div className="pointer-events-none absolute inset-0 bg-grid-dark" />
                  <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand-500/15 blur-3xl" />
                  <div className="pointer-events-none absolute left-0 bottom-0 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl" />

                  <div className="relative">
                    <div className="mb-5">
                      <h2 className="text-xl font-bold text-white">{selected.occupationTitle}</h2>
                      <p className="mt-0.5 text-xs text-white/40">
                        O*NET {selected.occupationCode} · Last run {formatDate(selected.generatedAt)}
                      </p>
                    </div>

                    {/* Score rings */}
                    <div className="flex flex-wrap items-center gap-8">
                      <ScoreRing score={selected.overallScore} label="Overall Match" size="lg" />
                      <div className="flex flex-wrap items-center gap-6">
                        <ScoreRing score={selected.skillScore}      label="Skills"      size="sm" />
                        <ScoreRing score={selected.experienceScore}  label="Experience"  size="sm" />
                        <ScoreRing score={selected.educationScore}   label="Education"   size="sm" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                {selected.summary && (
                  <div className="px-6 py-5">
                    <p className="text-sm leading-relaxed text-gray-600">{selected.summary}</p>
                  </div>
                )}
              </div>

              {/* Strengths */}
              {selected.strengths.length > 0 && (
                <div className="card">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs">✅</span>
                    Strengths
                    <span className="ml-auto rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                      {selected.strengths.length}
                    </span>
                  </h3>
                  <div className="space-y-2.5">
                    {selected.strengths.map((s, i) => (
                      <div key={i} className="flex gap-3 rounded-xl bg-green-50 border border-green-100 px-4 py-3">
                        <span className="mt-0.5 text-green-500 shrink-0">✓</span>
                        <div>
                          <p className="text-sm font-semibold text-green-900">{s.area}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-green-700">{s.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gaps */}
              {selected.gaps.length > 0 && (
                <div className="card">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs">⚠️</span>
                    Gaps to Address
                    <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      {selected.gaps.length}
                    </span>
                  </h3>
                  <div className="space-y-2.5">
                    {selected.gaps.map((g, i) => (
                      <div key={i} className="flex gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 hover:border-gray-300 transition-colors">
                        <span className="mt-0.5 text-amber-500 shrink-0">◆</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900">{g.area}</p>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${severityColor(g.severity)}`}>
                              {g.severity}
                            </span>
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-gray-600">{g.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {selected.recommendations.length > 0 && (
                <div className="card">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs">🚀</span>
                    Recommendations
                    <span className="ml-auto rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
                      {selected.recommendations.length}
                    </span>
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selected.recommendations.map((r, i) => {
                      const cfg = REC_CONFIGS[r.type] ?? { icon: '💡', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-100' }
                      return (
                        <div key={i} className={`rounded-xl border p-4 transition-all hover:shadow-sm ${cfg.bg}`}>
                          <div className="mb-2 flex items-center gap-2">
                            <span className="text-lg">{cfg.icon}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${cfg.color}`}>
                              {r.type}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{r.title}</p>
                          <p className="mt-1 text-xs leading-relaxed text-gray-500">{r.description}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </main>
    </div>
  )
}
