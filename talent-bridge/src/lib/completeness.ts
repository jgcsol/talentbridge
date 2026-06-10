import type { CandidateProfile } from './types'

export interface CompletenessItem {
  id:       string
  label:    string
  detail:   string
  points:   number
  done:     boolean
  href:     string
}

export interface CompletenessResult {
  score:    number   // 0–100
  items:    CompletenessItem[]
  tier:     'starter' | 'building' | 'strong' | 'complete'
}

/**
 * Calculate profile completeness for a candidate.
 * Total possible points = 100.
 */
export function calcCompleteness(profile: CandidateProfile | undefined): CompletenessResult {
  if (!profile) return { score: 0, items: [], tier: 'starter' }

  const items: CompletenessItem[] = [
    {
      id:     'resume',
      label:  'Upload your resume',
      detail: 'AI will extract your skills and experience automatically.',
      points: 20,
      done:   !!profile.resumeS3Key,
      href:   '/candidate/profile',
    },
    {
      id:     'headline',
      label:  'Add a professional headline',
      detail: 'e.g. "Senior Software Engineer · Java · AWS"',
      points: 10,
      done:   !!profile.headline?.trim(),
      href:   '/candidate/profile',
    },
    {
      id:     'location',
      label:  'Add your location',
      detail: 'Helps employers find local talent.',
      points: 5,
      done:   !!profile.location?.trim(),
      href:   '/candidate/profile',
    },
    {
      id:     'skills',
      label:  'Add at least 3 skills',
      detail: 'Skills are the primary signal employers search on.',
      points: 20,
      done:   (profile.skills?.length ?? 0) >= 3,
      href:   '/candidate/profile',
    },
    {
      id:     'skills_rich',
      label:  'Add 8+ skills with proficiency levels',
      detail: 'A richer skill set improves your match scores.',
      points: 10,
      done:   (profile.skills?.length ?? 0) >= 8,
      href:   '/candidate/profile',
    },
    {
      id:     'experience',
      label:  'Add work experience',
      detail: 'At least one role with dates and description.',
      points: 20,
      done:   (profile.experiences?.length ?? 0) >= 1,
      href:   '/candidate/profile',
    },
    {
      id:     'education',
      label:  'Add your education',
      detail: 'Degree, field, and institution.',
      points: 10,
      done:   (profile.educations?.length ?? 0) >= 1,
      href:   '/candidate/profile',
    },
    {
      id:     'visibility',
      label:  'Set profile visibility',
      detail: 'Choose who can find you — Public, Employers Only, or Private.',
      points: 5,
      done:   !!profile.visibility && profile.visibility !== 'PRIVATE',
      href:   '/candidate/profile',
    },
  ]

  const earned = items.filter(i => i.done).reduce((sum, i) => sum + i.points, 0)
  const score  = Math.round(earned)

  let tier: CompletenessResult['tier']
  if (score >= 90)      tier = 'complete'
  else if (score >= 65) tier = 'strong'
  else if (score >= 35) tier = 'building'
  else                  tier = 'starter'

  return { score, items, tier }
}

export const TIER_META = {
  starter:  { label: 'Getting started',   color: 'text-gray-500',   bar: 'bg-gray-400' },
  building: { label: 'Building up',       color: 'text-orange-600', bar: 'bg-orange-400' },
  strong:   { label: 'Strong profile',    color: 'text-blue-600',   bar: 'bg-blue-500' },
  complete: { label: 'Complete profile',  color: 'text-green-600',  bar: 'bg-green-500' },
}
