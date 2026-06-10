'use client'

import { useState, useEffect, useRef } from 'react'

export type Testimonial = {
  quote: string
  name: string
  role: string
  avatar: string
  metric: string
  category: string
  categoryIcon: string
  categoryColor: string
}

interface TestimonialCarouselProps {
  items: Testimonial[]
}

export function TestimonialCarousel({ items }: TestimonialCarouselProps) {
  const [active, setActive] = useState(0)
  const [visible, setVisible] = useState(true)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      transition((prev) => (prev + 1) % items.length)
    }, 5000)
  }

  // Fade out → swap content → fade in
  const transition = (getNext: (prev: number) => number) => {
    setVisible(false)
    setTimeout(() => {
      setActive((prev) => getNext(prev))
      setVisible(true)
    }, 250)
  }

  useEffect(() => {
    startTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goTo = (i: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    transition(() => i)
    startTimer()
  }
  const prev = () => goTo((active - 1 + items.length) % items.length)
  const next = () => goTo((active + 1) % items.length)

  const item = items[active]
  if (!item) return null

  return (
    <div className="relative">
      {/* Card */}
      <div
        className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-lg px-8 py-10 sm:px-12 sm:py-12 md:px-16 md:py-14 transition-opacity duration-200"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {/* Ambient blobs */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-50 blur-3xl opacity-70" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-52 w-52 rounded-full bg-violet-50 blur-2xl opacity-60" />

        {/* Category badge */}
        <div className="relative mb-7 flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${item.categoryColor} px-3.5 py-1 text-xs font-semibold text-white shadow-sm`}>
            {item.categoryIcon} {item.category}
          </span>
        </div>

        {/* Quote */}
        <div className="relative">
          <div className="mb-2 font-serif text-7xl leading-none text-brand-100 select-none">&ldquo;</div>
          <p className="text-xl font-medium leading-relaxed text-gray-800 md:text-2xl">
            {item.quote}
          </p>
        </div>

        {/* Stars */}
        <div className="relative mt-6 flex gap-0.5">
          {[0, 1, 2, 3, 4].map((s) => (
            <span key={s} className="text-base text-yellow-400">★</span>
          ))}
        </div>

        {/* Person + outcome */}
        <div className="relative mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${item.categoryColor} text-sm font-bold text-white shadow-md`}>
              {item.avatar}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{item.name}</p>
              <p className="text-sm text-gray-400">{item.role}</p>
            </div>
          </div>
          <span className="self-start rounded-full border border-brand-100 bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700 sm:self-auto">
            {item.metric}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={prev}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/60 backdrop-blur-sm transition-all hover:border-brand-400 hover:text-brand-300"
          aria-label="Previous testimonial"
        >
          ←
        </button>

        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to testimonial ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === active ? 'w-7 bg-brand-400' : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-white/30">{active + 1} / {items.length}</p>
        </div>

        <button
          onClick={next}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/60 backdrop-blur-sm transition-all hover:border-brand-400 hover:text-brand-300"
          aria-label="Next testimonial"
        >
          →
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-5 h-0.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          key={active}
          className={`h-full rounded-full bg-gradient-to-r ${item.categoryColor} animate-progress`}
        />
      </div>
    </div>
  )
}
