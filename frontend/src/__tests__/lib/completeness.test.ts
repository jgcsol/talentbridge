import { calcCompleteness } from '@/lib/completeness'
import type { CandidateProfile } from '@/lib/types'

const baseProfile: CandidateProfile = {
  id: 'p1',
  headline: null,
  location: null,
  summary: null,
  resumeS3Key: null,
  visibility: 'PRIVATE',
  skills: [],
  experiences: [],
  educations: [],
  certifications: [],
  profileComplete: false,
  updatedAt: '',
}

describe('calcCompleteness', () => {
  it('returns score 0 and starter tier for undefined profile', () => {
    const result = calcCompleteness(undefined)
    expect(result.score).toBe(0)
    expect(result.tier).toBe('starter')
    expect(result.items).toHaveLength(0)
  })

  it('scores resume upload at 20 points', () => {
    const result = calcCompleteness({ ...baseProfile, resumeS3Key: 'resumes/abc.pdf' })
    expect(result.score).toBe(20)
  })

  it('scores headline at 10 points', () => {
    const result = calcCompleteness({ ...baseProfile, headline: 'Software Engineer' })
    expect(result.score).toBe(10)
  })

  it('scores location at 5 points', () => {
    const result = calcCompleteness({ ...baseProfile, location: 'New York, NY' })
    expect(result.score).toBe(5)
  })

  it('scores 3 skills at 20 points', () => {
    const skills = [
      { name: 'Java', category: 'Backend', yearsExperience: null, proficiency: 'EXPERT' as const },
      { name: 'Python', category: 'Backend', yearsExperience: null, proficiency: 'ADVANCED' as const },
      { name: 'SQL', category: 'Data', yearsExperience: null, proficiency: 'INTERMEDIATE' as const },
    ]
    const result = calcCompleteness({ ...baseProfile, skills })
    expect(result.score).toBe(20)
  })

  it('scores 8+ skills at 30 points (3-skill + 8-skill bonus)', () => {
    const skills = Array.from({ length: 8 }, (_, i) => ({
      name: `Skill${i}`,
      category: 'General',
      yearsExperience: null,
      proficiency: 'INTERMEDIATE' as const,
    }))
    const result = calcCompleteness({ ...baseProfile, skills })
    expect(result.score).toBe(30)
  })

  it('scores experience at 20 points', () => {
    const experiences = [{
      title: 'Engineer',
      company: 'Acme',
      startDate: '2020-01',
      endDate: null,
      current: true,
      description: 'Built stuff',
    }]
    const result = calcCompleteness({ ...baseProfile, experiences })
    expect(result.score).toBe(20)
  })

  it('scores education at 10 points', () => {
    const educations = [{
      institution: 'MIT',
      degree: 'BS',
      field: 'CS',
      year: 2019,
    }]
    const result = calcCompleteness({ ...baseProfile, educations })
    expect(result.score).toBe(10)
  })

  it('scores non-PRIVATE visibility at 5 points', () => {
    const resultPublic = calcCompleteness({ ...baseProfile, visibility: 'PUBLIC' })
    const resultPrivate = calcCompleteness({ ...baseProfile, visibility: 'PRIVATE' })
    expect(resultPublic.score).toBe(5)   // PUBLIC adds 5 on top of PRIVATE base (0)
    expect(resultPrivate.score).toBe(0)
  })

  it('assigns correct tiers', () => {
    expect(calcCompleteness(undefined).tier).toBe('starter')

    // building: 35-64 — resume(20) + experience(20) = 40
    const building = calcCompleteness({
      ...baseProfile,
      resumeS3Key: 'r.pdf',
      experiences: [{ title: 'Dev', company: 'Co', startDate: '2020', endDate: null, current: true, description: '' }],
    })
    expect(building.tier).toBe('building')

    // strong: 65-89 — resume(20) + headline(10) + skills 3(20) + experience(20) = 70
    const strong3Skills = Array.from({ length: 3 }, (_, i) => ({ name: `S${i}`, category: 'General', yearsExperience: null, proficiency: 'BEGINNER' as const }))
    const strong = calcCompleteness({
      ...baseProfile,
      resumeS3Key: 'r.pdf',
      headline: 'Dev',
      skills: strong3Skills,
      experiences: [{ title: 'Dev', company: 'Co', startDate: '2020', endDate: null, current: true, description: '' }],
    })
    expect(strong.tier).toBe('strong')
  })

  it('returns complete tier at 90+ points', () => {
    const skills8 = Array.from({ length: 8 }, (_, i) => ({ name: `S${i}`, category: 'General', yearsExperience: null, proficiency: 'EXPERT' as const }))
    const full = calcCompleteness({
      ...baseProfile,
      resumeS3Key: 'r.pdf',
      headline: 'Engineer',
      location: 'NY',
      skills: skills8,
      experiences: [{ title: 'Dev', company: 'Co', startDate: '2020', endDate: null, current: true, description: '' }],
      educations: [{ institution: 'MIT', degree: 'BS', field: 'CS', year: 2019 }],
      visibility: 'PUBLIC',
    })
    expect(full.tier).toBe('complete')
    expect(full.score).toBe(100)
  })
})
