import React from 'react'
import { render, screen } from '@testing-library/react'
import { SkillBadge } from '@/components/ui/SkillBadge'
import type { Skill } from '@/lib/types'

describe('SkillBadge', () => {
  it('renders skill name', () => {
    const skill: Skill = { name: 'TypeScript', category: 'Frontend', yearsExperience: null, proficiency: 'EXPERT' }
    render(<SkillBadge skill={skill} />)
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
  })

  it('renders years of experience when provided', () => {
    const skill: Skill = { name: 'Java', category: 'Backend', proficiency: 'ADVANCED', yearsExperience: 5 }
    render(<SkillBadge skill={skill} />)
    expect(screen.getByText('5y')).toBeInTheDocument()
  })

  it('does not render years when not provided', () => {
    const skill: Skill = { name: 'Python', category: 'Backend', yearsExperience: null, proficiency: 'INTERMEDIATE' }
    render(<SkillBadge skill={skill} />)
    expect(screen.queryByText(/y$/)).not.toBeInTheDocument()
  })

  it('applies EXPERT proficiency styles', () => {
    const skill: Skill = { name: 'React', category: 'Frontend', yearsExperience: null, proficiency: 'EXPERT' }
    const { container } = render(<SkillBadge skill={skill} />)
    expect(container.firstChild).toHaveClass('bg-brand-100', 'text-brand-800')
  })

  it('applies BEGINNER proficiency styles', () => {
    const skill: Skill = { name: 'Rust', category: 'Systems', yearsExperience: null, proficiency: 'BEGINNER' }
    const { container } = render(<SkillBadge skill={skill} />)
    expect(container.firstChild).toHaveClass('bg-orange-100', 'text-orange-700')
  })

  it('falls back to gray style for unknown proficiency', () => {
    const skill = { name: 'Unknown', category: 'General', yearsExperience: null, proficiency: 'UNKNOWN' as Skill['proficiency'] }
    const { container } = render(<SkillBadge skill={skill} />)
    expect(container.firstChild).toHaveClass('bg-gray-100', 'text-gray-700')
  })
})
