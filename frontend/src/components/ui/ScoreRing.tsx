'use client'

import { cn, scoreColor } from '@/lib/utils'

interface ScoreRingProps {
  score: number
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm:  { ring: 64,  stroke: 6,  textSize: 'text-base' },
  md:  { ring: 110, stroke: 9,  textSize: 'text-2xl'  },
  lg:  { ring: 148, stroke: 11, textSize: 'text-4xl'  },
}

export function ScoreRing({ score, label, size = 'md' }: ScoreRingProps) {
  const { ring, stroke, textSize } = sizes[size]
  const r = (ring - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (score / 100) * c
  const center = ring / 2

  const trackColor =
    score >= 80 ? 'rgba(22,163,74,0.12)' :
    score >= 60 ? 'rgba(202,138,4,0.12)' :
                  'rgba(220,38,38,0.12)'

  const ringColor =
    score >= 80 ? '#16a34a' :
    score >= 60 ? '#ca8a04' :
                  '#dc2626'

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Ring + centered label */}
      <div className="relative flex items-center justify-center" style={{ width: ring, height: ring }}>
        <svg width={ring} height={ring} className="absolute inset-0 -rotate-90">
          {/* Track */}
          <circle
            cx={center} cy={center} r={r}
            strokeWidth={stroke}
            stroke={trackColor}
            fill="none"
          />
          {/* Progress */}
          <circle
            cx={center} cy={center} r={r}
            strokeWidth={stroke}
            stroke={ringColor}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        {/* Score text — sits above svg via z-index */}
        <span className={cn('relative z-10 font-extrabold tabular-nums leading-none', textSize, scoreColor(score))}>
          {score}%
        </span>
      </div>
      {label && (
        <p className="text-xs font-medium text-gray-500 text-center leading-tight">{label}</p>
      )}
    </div>
  )
}
