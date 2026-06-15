'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Nav } from '@/components/layout/Nav'
import { SkillBadge } from '@/components/ui/SkillBadge'
import { employerApi } from '@/lib/api'
import { useAuth } from '@/lib/hooks/useAuth'
import type { CandidateSearchResult } from '@/lib/types'

const NAV = [
  { href: '/employer/dashboard', label: 'Dashboard' },
  { href: '/employer/search',    label: 'Search Candidates' },
]

interface SearchParams {
  keyword: string
}

interface ApiPage {
  content: CandidateSearchResult[]
  totalElements: number
  totalPages: number
  number: number
}

export default function EmployerSearchPage() {
  const { isReady } = useAuth({ requiredRole: 'EMPLOYER' })
  const [keyword, setKeyword] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<CandidateSearchResult | null>(null)

  const { data, isLoading, isFetching } = useQuery<ApiPage>({
    queryKey: ['candidate-search', activeSearch, page],
    queryFn: () => employerApi.searchCandidates({ skills: activeSearch ? activeSearch.split(' ') : undefined, page }).then(r => r.data),
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    setActiveSearch(keyword)
    setSelected(null)
  }

  if (!isReady) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav links={NAV} />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Search Candidates</h1>
        <p className="text-gray-500 mb-8">
          Find job-ready candidates by skill, title, or keyword.
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <input
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="Search by skill, title, or keyword…"
            className="input flex-1"
          />
          <button type="submit" className="btn-primary px-6">Search</button>
        </form>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Candidate list */}
          <div className="lg:col-span-2 space-y-3">
            {(isLoading || isFetching) && (
              [...Array(5)].map((_, i) => (
                <div key={i} className="h-24 animate-pulse bg-gray-200 rounded-xl" />
              ))
            )}

            {data?.content?.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">🔍</p>
                <p>No candidates found. Try a different keyword.</p>
              </div>
            )}

            {data?.content?.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={`w-full text-left rounded-xl border-2 p-4 transition-colors ${
                  selected?.id === c.id
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <p className="font-semibold text-gray-900 text-sm">{c.headline ?? 'Candidate'}</p>
                {c.location && (
                  <p className="text-xs text-gray-400 mt-0.5">📍 {c.location}</p>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  {c.skills?.slice(0, 4).map(s => (
                    <SkillBadge key={s.name} skill={s} />
                  ))}
                  {(c.skills?.length ?? 0) > 4 && (
                    <span className="text-xs text-gray-400">+{c.skills.length - 4}</span>
                  )}
                </div>
              </button>
            ))}

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
                >
                  ← Prev
                </button>
                <span className="text-xs text-gray-400">
                  Page {page + 1} of {data.totalPages}
                </span>
                <button
                  disabled={page + 1 >= data.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </div>

          {/* Candidate detail */}
          <div className="lg:col-span-3">
            {selected ? (
              <div className="card space-y-6 sticky top-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selected.headline ?? 'Candidate'}</h2>
                    {selected.location && (
                      <p className="text-sm text-gray-500 mt-0.5">📍 {selected.location}</p>
                    )}
                  </div>
                  {selected.email && (
                    <a href={`mailto:${selected.email}`} className="btn-primary text-sm">
                      Contact
                    </a>
                  )}
                </div>

                {selected.summary && (
                  <p className="text-sm text-gray-600 leading-relaxed">{selected.summary}</p>
                )}

                {selected.skills?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selected.skills.map(s => (
                        <SkillBadge key={s.name} skill={s} />
                      ))}
                    </div>
                  </div>
                )}

                {selected.educations?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Education</h3>
                    <div className="space-y-2">
                      {selected.educations.map((e, i) => (
                        <div key={i}>
                          <p className="text-sm font-medium text-gray-900">
                            {e.degree} in {e.field}
                          </p>
                          <p className="text-xs text-gray-400">{e.institution}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!selected.email && (
                  <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-500">
                    🔒 This candidate has restricted contact. They can choose to make their email visible.
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400 text-center">
                <p className="text-4xl mb-3">👤</p>
                <p>Select a candidate to view their profile</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
