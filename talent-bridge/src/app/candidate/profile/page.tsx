'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Nav } from '@/components/layout/Nav'
import { SkillBadge } from '@/components/ui/SkillBadge'
import { ProfileCompleteness } from '@/components/ui/ProfileCompleteness'
import { candidateApi } from '@/lib/api'
import { useAuth } from '@/lib/hooks/useAuth'
import type { CandidateProfile, Visibility } from '@/lib/types'

const NAV = [
  { href: '/candidate/dashboard', label: 'Dashboard' },
  { href: '/candidate/profile',   label: 'My Profile' },
  { href: '/candidate/explore',   label: 'Explore Roles' },
]

const VISIBILITY_OPTIONS: { value: Visibility; label: string; description: string; icon: string }[] = [
  { value: 'PUBLIC',         icon: '🌐', label: 'Public',         description: 'Anyone can find and view your profile' },
  { value: 'EMPLOYERS_ONLY', icon: '🔒', label: 'Employers Only', description: 'Only verified employers can search you' },
  { value: 'PRIVATE',        icon: '👁️', label: 'Private',        description: 'Hidden from all searches' },
]

export default function ProfilePage() {
  const { isReady } = useAuth({ requiredRole: 'CANDIDATE' })
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [isDragging, setIsDragging] = useState(false)

  const { data: profile, isLoading } = useQuery<CandidateProfile>({
    queryKey: ['candidate-profile'],
    queryFn: () => candidateApi.getProfile().then(r => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CandidateProfile>) => candidateApi.updateProfile(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidate-profile'] }),
  })

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadStatus('uploading')
    try {
      await candidateApi.uploadResume(file)
      await qc.invalidateQueries({ queryKey: ['candidate-profile'] })
      setUploadStatus('done')
    } catch {
      setUploadStatus('error')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (fileRef.current) {
      const dt = new DataTransfer()
      dt.items.add(file)
      fileRef.current.files = dt.files
      fileRef.current.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }

  if (!isReady || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Nav links={NAV} />
        <div className="flex flex-col items-center justify-center gap-3 py-40">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-brand-100 border-t-brand-600" />
          <p className="text-sm text-gray-400 animate-pulse">Loading profile…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav links={NAV} />

      <main className="mx-auto max-w-3xl px-6 py-10 space-y-6">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your resume, skills, and visibility settings.</p>
        </div>

        {/* Completeness widget */}
        <ProfileCompleteness profile={profile} defaultExpanded />

        {/* ── Resume Upload ── */}
        <div className="card">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 text-sm">
              📄
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Resume</h2>
              <p className="text-xs text-gray-400">AI will extract your skills, experience, and education automatically</p>
            </div>
          </div>

          <input
            type="file"
            ref={fileRef}
            className="hidden"
            accept=".pdf,.docx,.doc"
            onChange={handleResumeUpload}
          />

          {uploadStatus === 'uploading' ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-brand-300 bg-brand-50 p-10 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
              <p className="text-sm font-semibold text-brand-700">Parsing your resume…</p>
              <p className="text-xs text-brand-500">This usually takes a few seconds</p>
            </div>
          ) : uploadStatus === 'done' ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-green-300 bg-green-50 p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl">✅</div>
              <p className="text-sm font-bold text-green-800">Resume uploaded successfully!</p>
              <p className="text-xs text-green-600">Your profile has been updated with extracted data.</p>
              <button onClick={() => setUploadStatus('idle')} className="btn-secondary text-xs py-1.5 px-3">
                Upload another
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`upload-zone ${isDragging ? 'border-brand-500 bg-brand-50/60' : ''}`}
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl transition-transform duration-200 ${isDragging ? 'scale-110' : ''} ${profile?.resumeS3Key ? 'bg-green-50' : 'bg-gray-100'}`}>
                {profile?.resumeS3Key ? '✅' : '📄'}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  {profile?.resumeS3Key ? 'Resume on file — click to replace' : 'Drop your resume here'}
                </p>
                <p className="mt-1 text-xs text-gray-400">PDF, DOCX, or DOC · Max 10MB</p>
              </div>
              <span className="btn-secondary text-xs py-1.5 px-4 pointer-events-none">
                {profile?.resumeS3Key ? '🔄 Replace resume' : '📂 Browse files'}
              </span>
              {uploadStatus === 'error' && (
                <p className="text-xs font-medium text-red-600">Upload failed — please try again</p>
              )}
            </div>
          )}
        </div>

        {/* ── Visibility ── */}
        <div className="card">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 text-sm">
              🌐
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Profile Visibility</h2>
              <p className="text-xs text-gray-400">Control who can discover you in employer searches</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {VISIBILITY_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 px-4 py-3.5 transition-all duration-150 ${
                  profile?.visibility === opt.value
                    ? 'border-brand-500 bg-brand-50 shadow-sm shadow-brand-500/10'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value={opt.value}
                  checked={profile?.visibility === opt.value}
                  onChange={() => updateMutation.mutate({ visibility: opt.value })}
                  className="sr-only"
                />
                <span className="text-xl">{opt.icon}</span>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${profile?.visibility === opt.value ? 'text-brand-700' : 'text-gray-800'}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-gray-500">{opt.description}</p>
                </div>
                {profile?.visibility === opt.value && (
                  <span className="shrink-0 rounded-full bg-brand-500 p-0.5 text-white">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* ── Skills ── */}
        {profile?.skills && profile.skills.length > 0 && (
          <div className="card">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-brand-500 text-sm">
                ⚡
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-bold text-gray-900">Skills</h2>
                <p className="text-xs text-gray-400">{profile.skills.length} skills extracted from your resume</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map((s) => (
                <SkillBadge key={s.name} skill={s} />
              ))}
            </div>
          </div>
        )}

        {/* ── Experience ── */}
        {profile?.experiences && profile.experiences.length > 0 && (
          <div className="card">
            <div className="mb-5 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-400 to-pink-500 text-sm">
                💼
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">Experience</h2>
                <p className="text-xs text-gray-400">{profile.experiences.length} positions</p>
              </div>
            </div>
            <div className="relative space-y-0">
              {/* Timeline line */}
              <div className="absolute left-[13px] top-1 bottom-0 w-px bg-gradient-to-b from-brand-200 to-transparent" />
              {profile.experiences.map((e, i) => (
                <div key={i} className="relative flex gap-5 pb-6 last:pb-0">
                  {/* Timeline dot */}
                  <div className="relative mt-0.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-500 text-[10px] shadow-sm shadow-brand-500/30 z-10">
                    💼
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-sm font-bold text-gray-900">{e.title}</p>
                    <p className="text-sm text-gray-600">{e.company}</p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {e.startDate} – {e.current ? 'Present' : e.endDate ?? ''}
                    </p>
                    {e.description && (
                      <p className="mt-1.5 text-xs leading-relaxed text-gray-500 line-clamp-2">{e.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Education ── */}
        {profile?.educations && profile.educations.length > 0 && (
          <div className="card">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-sm">
                🎓
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">Education</h2>
              </div>
            </div>
            <div className="space-y-3">
              {profile.educations.map((e, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl bg-gray-50 px-4 py-3 border border-gray-100">
                  <span className="text-xl shrink-0">🏫</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{e.degree} in {e.field}</p>
                    <p className="text-xs text-gray-500">{e.institution}{e.year ? ` · ${e.year}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Certifications ── */}
        {profile?.certifications && profile.certifications.length > 0 && (
          <div className="card">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500 text-sm">
                🏅
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">Certifications</h2>
              </div>
            </div>
            <div className="space-y-2.5">
              {profile.certifications.map((c, i) => (
                <div key={i} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-3 border border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🏅</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.issuer}</p>
                    </div>
                  </div>
                  {c.year && (
                    <span className="shrink-0 rounded-full bg-white border border-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                      {c.year}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
