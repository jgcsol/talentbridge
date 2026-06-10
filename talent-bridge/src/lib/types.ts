// ── Auth ──────────────────────────────────────────────────────────────────────

export type UserRole = 'CANDIDATE' | 'EMPLOYER'

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  userId: string
  email: string
  role: UserRole
}

// ── Candidate ─────────────────────────────────────────────────────────────────

export type Proficiency = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'
export type Visibility = 'PUBLIC' | 'EMPLOYERS_ONLY' | 'PRIVATE'

export interface Skill {
  name: string
  category: string
  yearsExperience: number | null
  proficiency: Proficiency
}

export interface Experience {
  title: string
  company: string
  startDate: string   // YYYY-MM
  endDate: string | null
  description: string
  current: boolean
}

export interface Education {
  degree: string
  field: string
  institution: string
  year: number | null
}

export interface Certification {
  name: string
  issuer: string
  year: number | null
}

export interface CandidateProfile {
  id: string
  headline: string | null
  location: string | null
  summary: string | null
  resumeS3Key: string | null
  visibility: Visibility
  skills: Skill[]
  experiences: Experience[]
  educations: Education[]
  certifications: Certification[]
  profileComplete: boolean
  updatedAt: string
}

// ── O*NET ─────────────────────────────────────────────────────────────────────

export interface OnetOccupation {
  code: string
  title: string
  description: string
  industry: string | null
  requiredSkills: Array<{
    name: string
    description: string
    importance: number
    level: number
  }>
  tasks: string[]
  minimumEducation: string | null
}

export interface OnetSearchResult {
  total: number
  start: number
  end: number
  occupation: Array<{ code: string; title: string; tags?: string }>
}

export interface OnetIndustry {
  code: string
  title: string
}

// ── Gap Analysis ──────────────────────────────────────────────────────────────

export interface GapAnalysis {
  id: string
  occupationCode: string
  occupationTitle: string
  overallScore: number
  skillScore: number
  experienceScore: number
  educationScore: number
  strengths: Array<{ area: string; detail: string }>
  gaps: Array<{ area: string; detail: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' }>
  recommendations: Array<{ type: string; title: string; description: string }>
  summary: string
  generatedAt: string
}

// ── Employer ──────────────────────────────────────────────────────────────────

export interface EmployerProfile {
  id: string
  companyName: string | null
  industry: string | null
  companySize: string | null
  website: string | null
  description: string | null
  location: string | null
}

export interface CandidateSearchResult {
  id: string
  headline: string | null
  location: string | null
  summary: string | null
  skills: Skill[]
  educations: Education[]
  visibility: Visibility
  email: string | null
}
