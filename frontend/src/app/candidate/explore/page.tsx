'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Nav } from '@/components/layout/Nav'
import { onetApi, gapApi, candidateApi } from '@/lib/api'
import { useAuth } from '@/lib/hooks/useAuth'
import type { OnetSearchResult, OnetIndustry, CandidateProfile } from '@/lib/types'

const NAV = [
  { href: '/candidate/dashboard', label: 'Dashboard' },
  { href: '/candidate/profile',   label: 'My Profile' },
  { href: '/candidate/explore',   label: 'Explore Roles' },
]

const QUICK_SEARCHES = [
  { label: '💻 Software Engineer',   q: 'software engineer' },
  { label: '📊 Data Analyst',        q: 'data analyst' },
  { label: '☁️ Cloud Engineer',      q: 'cloud engineer' },
  { label: '🔒 Cybersecurity',       q: 'cybersecurity analyst' },
  { label: '🖥️ Data Center Tech',    q: 'data center technician' },
  { label: '🤖 Machine Learning',    q: 'machine learning engineer' },
  { label: '🌐 Network Engineer',    q: 'network engineer' },
  { label: '📱 Product Manager',     q: 'product manager' },
]

const PAGE_SIZE = 20

type Mode = 'search' | 'browse'

export default function ExplorePage() {
  const { isReady } = useAuth({ requiredRole: 'CANDIDATE' })
  const router = useRouter()
  const qc = useQueryClient()

  const [mode, setMode] = useState<Mode>('browse')

  // Search state
  const [keyword, setKeyword] = useState('')
  const [activeSearch, setActiveSearch] = useState('software engineer')
  const [searchPage, setSearchPage] = useState(1)

  // Browse state
  const [browsePage, setBrowsePage] = useState(1)
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)

  const [analyzingCode, setAnalyzingCode] = useState<string | null>(null)
  const [showResumePrompt, setShowResumePrompt] = useState(false)

  // ── Data fetching ──────────────────────────────────────────────────────────

  const { data: profile } = useQuery<CandidateProfile>({
    queryKey: ['candidate-profile'],
    queryFn: () => candidateApi.getProfile().then(r => r.data),
  })

  const { data: industries } = useQuery<OnetIndustry[]>({
    queryKey: ['onet-industries'],
    queryFn: () => onetApi.getIndustries().then(r => r.data),
    staleTime: 1000 * 60 * 60, // 1h
  })

  const { data: searchData, isLoading: searchLoading, isFetching: searchFetching } = useQuery<OnetSearchResult>({
    queryKey: ['onet-search', activeSearch, searchPage],
    queryFn: () => onetApi.searchOccupations(activeSearch, searchPage).then(r => r.data),
    enabled: mode === 'search' && !!activeSearch,
  })

  const { data: browseData, isLoading: browseLoading, isFetching: browseFetching } = useQuery<OnetSearchResult>({
    queryKey: ['onet-browse', selectedIndustry, browsePage],
    queryFn: () =>
      selectedIndustry
        ? onetApi.browseByIndustry(selectedIndustry, browsePage).then(r => r.data)
        : onetApi.listAll(browsePage, PAGE_SIZE).then(r => r.data),
    enabled: mode === 'browse',
  })

  // ── Mutations ──────────────────────────────────────────────────────────────

  const analyzeMutation = useMutation({
    mutationFn: (occupationCode: string) => gapApi.analyze(occupationCode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gap-analyses'] })
      router.push('/candidate/gap-analysis')
    },
  })

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (keyword.trim()) {
      setActiveSearch(keyword.trim())
      setSearchPage(1)
      setMode('search')
    }
  }

  const handleQuickSearch = (q: string) => {
    setKeyword(q)
    setActiveSearch(q)
    setSearchPage(1)
    setMode('search')
  }

  const handleIndustrySelect = (code: string | null) => {
    setSelectedIndustry(code)
    setBrowsePage(1)
    setMode('browse')
  }

  const handleAnalyze = async (code: string) => {
    if (!profile?.profileComplete) {
      setShowResumePrompt(true)
      return
    }
    setAnalyzingCode(code)
    try {
      await analyzeMutation.mutateAsync(code)
    } finally {
      setAnalyzingCode(null)
    }
  }

  if (!isReady) return null

  const activeData = mode === 'search' ? searchData : browseData
  const isLoading  = mode === 'search' ? searchLoading  : browseLoading
  const isFetching = mode === 'search' ? searchFetching : browseFetching
  const page       = mode === 'search' ? searchPage     : browsePage
  const setPage    = mode === 'search' ? setSearchPage  : setBrowsePage
  const totalPages = activeData ? Math.ceil(activeData.total / PAGE_SIZE) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav links={NAV} />

      <main className="mx-auto max-w-5xl px-6 py-10">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Choose Your Target Role</h1>
          <p className="mt-1 text-sm text-gray-500">
            Browse all {browseData && !selectedIndustry ? browseData.total.toLocaleString() : 'O*NET'} occupations or search by title, then run an AI gap analysis against your profile.
          </p>
        </div>

        {/* Mode tabs */}
        <div className="mb-6 flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
          <button
            onClick={() => setMode('browse')}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
              mode === 'browse'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Browse All
          </button>
          <button
            onClick={() => setMode('search')}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
              mode === 'search'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Keyword Search
          </button>
        </div>

        {/* ── SEARCH MODE ── */}
        {mode === 'search' && (
          <>
            <div className="mb-5">
              <form onSubmit={handleSearch} className="flex gap-3">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  <input
                    type="text"
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    placeholder="Search any job title, e.g. Data Center Technician, Network Engineer…"
                    className="input w-full pl-10 py-3 text-sm"
                  />
                </div>
                <button type="submit" className="btn-primary px-6 py-3 text-sm">
                  Search
                </button>
              </form>
            </div>
            <div className="mb-6 flex flex-wrap gap-2">
              {QUICK_SEARCHES.map(({ label, q }) => (
                <button
                  key={q}
                  onClick={() => handleQuickSearch(q)}
                  className={`chip text-xs ${activeSearch === q ? 'chip-active' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── BROWSE MODE — industry filter ── */}
        {mode === 'browse' && industries && industries.length > 0 && (
          <div className="mb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Filter by Career Cluster</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleIndustrySelect(null)}
                className={`chip text-xs ${selectedIndustry === null ? 'chip-active' : ''}`}
              >
                All Occupations
              </button>
              {industries.map(ind => (
                <button
                  key={ind.code}
                  onClick={() => handleIndustrySelect(ind.code)}
                  className={`chip text-xs ${selectedIndustry === ind.code ? 'chip-active' : ''}`}
                >
                  {ind.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {(isLoading || isFetching) && (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-[72px] animate-pulse rounded-2xl bg-gray-200" />
            ))}
          </div>
        )}

        {activeData && !isFetching && (
          <>
            <p className="mb-4 text-xs font-medium text-gray-400 uppercase tracking-wide">
              {mode === 'search'
                ? `${activeData.total.toLocaleString()} result${activeData.total !== 1 ? 's' : ''} for "${activeSearch}"`
                : selectedIndustry
                  ? `${activeData.total.toLocaleString()} occupation${activeData.total !== 1 ? 's' : ''} in selected cluster`
                  : `All ${activeData.total.toLocaleString()} O*NET occupations — page ${page} of ${totalPages}`}
            </p>

            <div className="space-y-3">
              {activeData.occupation?.map((occ) => (
                <div
                  key={occ.code}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-violet-50 text-lg ring-1 ring-gray-100 group-hover:from-brand-100 group-hover:to-violet-100 transition-colors">
                      💼
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-gray-900">{occ.title}</p>
                        {occ.brightOutlook && (
                          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                            ✦ Bright Outlook
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <p className="text-xs text-gray-400">O*NET {occ.code}</p>
                        {occ.zone && (
                          <p className="truncate text-xs text-gray-400">· {occ.zone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAnalyze(occ.code)}
                    disabled={!!analyzingCode}
                    className="btn-primary shrink-0 py-2 px-4 text-xs"
                  >
                    {analyzingCode === occ.code ? (
                      <span className="flex items-center gap-1.5">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Analyzing…
                      </span>
                    ) : (
                      'Analyze my fit →'
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  ← Prev
                </button>
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {!activeData && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 py-20 text-center">
            <span className="text-4xl">🔍</span>
            <p className="text-sm font-medium text-gray-500">
              {mode === 'search' ? 'Search for a role above to get started' : 'Loading occupations…'}
            </p>
          </div>
        )}

        {/* Analyzing overlay */}
        {analyzingCode && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-100 bg-white p-10 shadow-xl">
              <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-brand-100 border-t-brand-600" />
              <div className="text-center">
                <p className="text-base font-bold text-gray-900">Running gap analysis…</p>
                <p className="mt-1 text-sm text-gray-500">AI is comparing your profile to O*NET data</p>
              </div>
            </div>
          </div>
        )}

        {/* Resume required modal */}
        {showResumePrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-8 shadow-2xl">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl ring-1 ring-amber-100">
                📄
              </div>
              <h2 className="text-lg font-bold text-gray-900">Resume required</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                A gap analysis compares your profile against the role's O*NET requirements. Upload your résumé first so the AI has your skills and experience to work with.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <Link
                  href="/candidate/profile"
                  className="btn-primary w-full text-center text-sm"
                  onClick={() => setShowResumePrompt(false)}
                >
                  Go to My Profile →
                </Link>
                <button
                  onClick={() => setShowResumePrompt(false)}
                  className="btn-secondary w-full text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
