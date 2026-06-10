import type { Testimonial } from '@/components/ui/TestimonialCarousel'

export const SKILLS = [
  'React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 'PostgreSQL',
  'Kubernetes', 'GraphQL', 'Machine Learning', 'Scrum / Agile', 'CI/CD',
  'Java', 'Spring Boot', 'Next.js', 'Azure', 'Go', 'Rust', 'Figma', 'TensorFlow',
]

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: "The gap analysis showed me exactly which AWS certs would push my score from 62% to 90%. Six months later I landed the Cloud Architect role.",
    name: 'Alex R.',
    role: 'Software Engineer → Cloud Architect',
    avatar: 'AR',
    metric: '+28% match score',
    category: 'Career Changers',
    categoryIcon: '🔄',
    categoryColor: 'from-violet-500 to-pink-500',
  },
  {
    quote: "I had no idea what skills were actually blocking me. TalentBridge mapped it out clearly — I focused on two certifications and got interviews within weeks.",
    name: 'Priya M.',
    role: 'Marketing Manager → Product Manager',
    avatar: 'PM',
    metric: '3 offers in 6 weeks',
    category: 'Career Changers',
    categoryIcon: '🔄',
    categoryColor: 'from-violet-500 to-pink-500',
  },
  {
    quote: "We cut time-to-interview by 40% by only reaching out to candidates with 80%+ match scores. The quality difference is night and day.",
    name: 'Sarah K.',
    role: 'Head of Talent, FinTech startup',
    avatar: 'SK',
    metric: '40% faster hiring',
    category: 'Hiring Teams',
    categoryIcon: '🏢',
    categoryColor: 'from-brand-500 to-violet-500',
  },
  {
    quote: "We used to get 300 applications and interview 5 people. Now we filter by skill match first and our offer acceptance rate has doubled.",
    name: 'Daniel W.',
    role: 'Engineering Manager, Series B startup',
    avatar: 'DW',
    metric: '2× offer acceptance',
    category: 'Hiring Teams',
    categoryIcon: '🏢',
    categoryColor: 'from-brand-500 to-violet-500',
  },
  {
    quote: "Other job sites give keyword matches. TalentBridge gives me a skills scorecard against real O*NET standards. There's no going back.",
    name: 'Marcus T.',
    role: 'UX Designer, 3× job-seeker',
    avatar: 'MT',
    metric: 'Role found in 3 weeks',
    category: 'Active Job Seekers',
    categoryIcon: '🎯',
    categoryColor: 'from-green-500 to-brand-500',
  },
  {
    quote: "I could finally see why I kept getting rejected. My experience matched but my tooling skills were behind. Fixed that, got hired.",
    name: 'Janelle B.',
    role: 'Data Analyst → Senior Analyst',
    avatar: 'JB',
    metric: '30% salary increase',
    category: 'Active Job Seekers',
    categoryIcon: '🎯',
    categoryColor: 'from-green-500 to-brand-500',
  },
]

export const TESTIMONIAL_CATEGORIES = [
  { label: 'Career Changers', icon: '🔄', color: 'from-violet-500 to-pink-500' },
  { label: 'Hiring Teams',    icon: '🏢', color: 'from-brand-500 to-violet-500' },
  { label: 'Job Seekers',     icon: '🎯', color: 'from-green-500 to-brand-500' },
] as const

export const HERO_SCORE_BARS = [
  { label: 'Technical Skills', score: 92, color: 'from-brand-400 to-violet-400' },
  { label: 'Experience',       score: 78, color: 'from-violet-400 to-pink-400' },
  { label: 'Education',        score: 95, color: 'from-green-400 to-brand-400' },
] as const

export const HERO_STATS = [
  { value: 'O*NET', label: 'Industry Standard Data' },
  { value: 'AI',    label: 'Powered Analysis' },
  { value: '100%',  label: 'Free for Candidates' },
] as const

export const BENTO_SCORE_BARS = [
  { label: 'Skills',     pct: 92 },
  { label: 'Experience', pct: 78 },
  { label: 'Education',  pct: 95 },
] as const

export const CANDIDATE_PERKS = [
  'Free gap analysis against any role',
  'Resume parsing in seconds',
  'Personalized skill recommendations',
] as const

export const EMPLOYER_PERKS = [
  'Search by skill-match percentage',
  'Only see pre-qualified talent',
  'Reduce time-to-hire dramatically',
] as const

export const FOOTER_LINKS = [
  { href: '/login',              label: 'Sign in' },
  { href: '/register',           label: 'Register' },
  { href: '/register?role=EMPLOYER', label: 'For employers' },
] as const
