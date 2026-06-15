import { cn } from '@/lib/utils'
import type { Skill } from '@/lib/types'

const proficiencyStyle: Record<string, string> = {
  EXPERT:       'bg-brand-100 text-brand-800',
  ADVANCED:     'bg-blue-100 text-blue-800',
  INTERMEDIATE: 'bg-gray-100 text-gray-700',
  BEGINNER:     'bg-orange-100 text-orange-700',
}

export function SkillBadge({ skill }: { skill: Skill }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
      proficiencyStyle[skill.proficiency] ?? 'bg-gray-100 text-gray-700'
    )}>
      {skill.name}
      {skill.yearsExperience && (
        <span className="opacity-60">{skill.yearsExperience}y</span>
      )}
    </span>
  )
}
