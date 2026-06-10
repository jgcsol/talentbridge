'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { calcCompleteness, TIER_META } from '@/lib/completeness'
import type { CandidateProfile } from '@/lib/types'

interface Props {
  profile: CandidateProfile | undefined
  /** Show full checklist expanded by default */
  defaultExpanded?: boolean
}

export function ProfileCompleteness({ profile, defaultExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const { score, items, tier } = calcCompleteness(profile)
  const meta = TIER_META[tier]

  const remaining = items.filter(i => !i.done)
  const nextItem  = remaining[0]

  return (
    <div className="card">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-semibold text-gray-900">Profile Completeness</h2>
          <p className={cn('text-xs font-medium mt-0.5', meta.color)}>{meta.label}</p>
        </div>
        <span className={cn('text-2xl font-bold tabular-nums', meta.color)}>
          {score}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden mb-4">
        <div
          className={cn('h-full rounded-full transition-all duration-700', meta.bar)}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Next action callout */}
      {nextItem && !expanded && (
        <div className="flex items-start gap-3 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2.5 mb-3">
          <span className="text-base mt-0.5">⚡</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-700">Next: {nextItem.label}</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{nextItem.detail}</p>
          </div>
          <Link href={nextItem.href} className="btn-primary text-xs px-3 py-1.5 shrink-0">
            Go →
          </Link>
        </div>
      )}

      {/* Toggle checklist */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="text-xs text-brand-600 hover:underline font-medium"
      >
        {expanded ? '▲ Hide checklist' : `▼ Show checklist (${remaining.length} remaining)`}
      </button>

      {/* Full checklist */}
      {expanded && (
        <ul className="mt-4 space-y-2">
          {items.map(item => (
            <li key={item.id} className="flex items-start gap-3">
              {/* Checkbox */}
              <div className={cn(
                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs',
                item.done
                  ? 'border-green-500 bg-green-500 text-white'
                  : 'border-gray-300 bg-white text-gray-300'
              )}>
                {item.done && '✓'}
              </div>

              {/* Label + detail */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm font-medium leading-snug',
                  item.done ? 'text-gray-400 line-through' : 'text-gray-800'
                )}>
                  {item.label}
                  <span className="ml-1.5 text-xs text-gray-400 no-underline">
                    +{item.points}pts
                  </span>
                </p>
                {!item.done && (
                  <p className="text-xs text-gray-400 mt-0.5">{item.detail}</p>
                )}
              </div>

              {/* Action link */}
              {!item.done && (
                <Link
                  href={item.href}
                  className="shrink-0 text-xs text-brand-600 hover:underline font-medium"
                >
                  Fix →
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Complete state */}
      {score === 100 && (
        <div className="mt-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          🎉 Your profile is complete! Employers can find you at your best.
        </div>
      )}
    </div>
  )
}
