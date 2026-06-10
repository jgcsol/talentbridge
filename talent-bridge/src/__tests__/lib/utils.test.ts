import { cn, scoreColor, scoreBg, severityColor, formatDate } from '@/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('deduplicates conflicting tailwind classes (last wins)', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('ignores falsy values', () => {
    expect(cn('foo', false, undefined, null, 'bar')).toBe('foo bar')
  })
})

describe('scoreColor', () => {
  it('returns green for score >= 80', () => {
    expect(scoreColor(80)).toBe('text-green-600')
    expect(scoreColor(100)).toBe('text-green-600')
  })

  it('returns yellow for score 60-79', () => {
    expect(scoreColor(60)).toBe('text-yellow-600')
    expect(scoreColor(79)).toBe('text-yellow-600')
  })

  it('returns red for score < 60', () => {
    expect(scoreColor(0)).toBe('text-red-600')
    expect(scoreColor(59)).toBe('text-red-600')
  })
})

describe('scoreBg', () => {
  it('returns green bg for score >= 80', () => {
    expect(scoreBg(80)).toBe('bg-green-100 text-green-800')
  })

  it('returns yellow bg for score 60-79', () => {
    expect(scoreBg(65)).toBe('bg-yellow-100 text-yellow-800')
  })

  it('returns red bg for score < 60', () => {
    expect(scoreBg(40)).toBe('bg-red-100 text-red-800')
  })
})

describe('severityColor', () => {
  it('returns red for HIGH', () => {
    expect(severityColor('HIGH')).toBe('bg-red-100 text-red-800')
  })

  it('returns yellow for MEDIUM', () => {
    expect(severityColor('MEDIUM')).toBe('bg-yellow-100 text-yellow-800')
  })

  it('returns blue for LOW', () => {
    expect(severityColor('LOW')).toBe('bg-blue-100 text-blue-800')
  })
})

describe('formatDate', () => {
  it('formats an ISO date string to short month + year', () => {
    const result = formatDate('2023-06-15T00:00:00Z')
    // Allow for locale differences in separators
    expect(result).toMatch(/Jun\s*2023/)
  })

  it('formats January correctly', () => {
    const result = formatDate('2024-01-15T12:00:00Z')
    expect(result).toMatch(/Jan\s*2024/)
  })
})
