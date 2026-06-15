import Link from 'next/link'
import { TestimonialCarousel } from '@/components/ui/TestimonialCarousel'
import {
  SKILLS,
  TESTIMONIALS,
  TESTIMONIAL_CATEGORIES,
  HERO_SCORE_BARS,
  HERO_STATS,
  BENTO_SCORE_BARS,
  CANDIDATE_PERKS,
  EMPLOYER_PERKS,
  FOOTER_LINKS,
} from '@/lib/data/home'

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden">

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative min-h-screen bg-[#07071a] flex flex-col">
        {/* Ambient blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-brand-600/20 blur-[100px]" />
          <div className="absolute top-1/2 -left-32 h-96 w-96 rounded-full bg-violet-600/15 blur-[80px]" />
          <div className="absolute bottom-0 right-1/3 h-72 w-72 rounded-full bg-brand-500/10 blur-[60px]" />
          <div className="absolute inset-0 bg-grid-dark" />
        </div>

        {/* Nav */}
        <nav className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🌉</span>
            <span className="text-lg font-bold text-white">TalentBridge</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 hover:bg-brand-500 transition-all hover:-translate-y-px"
            >
              Get started free
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 mx-auto flex max-w-6xl flex-1 items-center px-6 py-12 lg:py-0">
          <div className="grid w-full gap-16 lg:grid-cols-2 lg:items-center">

            {/* Left */}
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-500/25 bg-brand-500/10 px-3.5 py-1.5 text-xs font-medium text-brand-300">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
                Powered by AI &amp; O*NET Industry Standards
              </div>

              <h1 className="text-5xl font-bold leading-[1.12] text-white sm:text-6xl lg:text-[4rem] xl:text-[4.5rem]">
                Bridge the gap between{' '}
                <span className="bg-gradient-to-r from-brand-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                  talent &amp; opportunity
                </span>
              </h1>

              <p className="mt-6 text-lg leading-relaxed text-white/55">
                Upload your resume and get an AI-powered gap analysis against any occupation.
                Discover exactly what skills you need — backed by O*NET data.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register?role=CANDIDATE"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-brand-600/25 hover:bg-brand-500 transition-all duration-200 hover:-translate-y-0.5"
                >
                  Find my next role →
                </Link>
                <Link
                  href="/register?role=EMPLOYER"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/10 transition-all duration-200"
                >
                  I&apos;m hiring talent
                </Link>
              </div>

              <p className="mt-4 text-xs text-white/30">
                Free for job seekers · No credit card required
              </p>
            </div>

            {/* Right – mock analysis card */}
            <div className="relative hidden lg:block animate-float">
              {/* Glow behind card */}
              <div className="absolute inset-0 rounded-3xl bg-brand-500/20 blur-2xl scale-95" />

              <div className="relative rounded-2xl border border-white/10 bg-white/[0.06] p-7 backdrop-blur-xl shadow-2xl">
                {/* Card header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-xs font-medium text-white/40 uppercase tracking-widest">Gap Analysis</p>
                    <p className="mt-1 text-xl font-bold text-white">Software Engineer III</p>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-green-500/15 border border-green-500/25 px-3 py-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                    <span className="text-sm font-bold text-green-400">87% match</span>
                  </div>
                </div>

                {/* Score bars */}
                <div className="space-y-4">
                  {HERO_SCORE_BARS.map(({ label, score, color }) => (
                    <div key={label}>
                      <div className="mb-1.5 flex justify-between text-xs">
                        <span className="font-medium text-white/60">{label}</span>
                        <span className="font-bold text-white">{score}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${color}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recommendation chip */}
                <div className="mt-6 rounded-xl border border-brand-400/20 bg-brand-500/10 p-4">
                  <p className="text-xs font-semibold text-brand-300">💡 Top recommendation</p>
                  <p className="mt-1 text-xs text-white/50">
                    Complete AWS Solutions Architect certification to boost your score by +8%
                  </p>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -bottom-5 -left-8 flex items-center gap-2 rounded-full border border-white/10 bg-gray-900/90 px-4 py-2 text-xs font-medium text-white/70 shadow-xl backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                Resume parsed in 3 seconds
              </div>
              <div className="absolute -top-5 right-6 flex items-center gap-1.5 rounded-full border border-white/10 bg-gray-900/90 px-4 py-2 text-xs font-medium text-white/70 shadow-xl backdrop-blur-sm">
                📊 O*NET Verified
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative z-10 border-t border-white/8 py-8">
          <div className="mx-auto grid max-w-4xl grid-cols-3 gap-6 px-6">
            {HERO_STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-extrabold text-white">{s.value}</p>
                <p className="mt-1 text-xs text-white/40">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Skills ticker */}
        <div className="relative z-10 overflow-hidden border-t border-white/8 py-5">
          <div className="animate-ticker flex gap-8 whitespace-nowrap">
            {[...SKILLS, ...SKILLS].map((skill, i) => (
              <span
                key={`${skill}-${i}`}
                className="inline-flex items-center gap-2 text-xs font-medium text-white/35"
              >
                <span className="h-1 w-1 rounded-full bg-brand-500/60" />
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENTO FEATURES ────────────────────────────────────── */}
      <section className="bg-gray-50 py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">How it works</p>
            <h2 className="mt-3 text-4xl font-bold text-gray-900">
              Your entire career workflow,<br className="hidden sm:block" /> in one place
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-gray-500">
              From resume upload to job match — AI does the heavy lifting.
            </p>
          </div>

          {/* Bento grid */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {/* Big card – AI analysis */}
            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-violet-700 p-8 lg:col-span-2 lg:row-span-1">
              <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
              <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-violet-500/30 blur-2xl" />
              <div className="relative">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl backdrop-blur-sm">
                  🤖
                </div>
                <h3 className="text-xl font-bold text-white">AI-Powered Gap Analysis</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65 max-w-md">
                  Our AI reads your resume, maps your skills to O*NET occupational standards, and produces a scored breakdown — skills, experience, and education — in seconds.
                </p>
                {/* Mini score visual */}
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {BENTO_SCORE_BARS.map(({ label, pct }) => (
                    <div key={label} className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
                      <p className="text-lg font-extrabold text-white">{pct}%</p>
                      <p className="text-xs text-white/50">{label}</p>
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/20">
                        <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card – O*NET data */}
            <div className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                📊
              </div>
              <h3 className="text-lg font-bold text-gray-900">O*NET Standards</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Every analysis is grounded in the U.S. Department of Labor&apos;s occupational database — 1,000+ roles, real skill requirements.
              </p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {['900+ occupations', 'Real KSAs', 'Updated annually'].map(t => (
                  <span key={t} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">{t}</span>
                ))}
              </div>
            </div>

            {/* Card – Resume parsing */}
            <div className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-2xl">
                📄
              </div>
              <h3 className="text-lg font-bold text-gray-900">Instant Resume Parsing</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Upload your PDF or DOCX. Skills, roles, and education are extracted automatically — your profile is ready in seconds.
              </p>
              <div className="mt-5 flex items-center gap-2 text-xs text-green-700 font-medium">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                Parsed in under 5 seconds
              </div>
            </div>

            {/* Big card – Get discovered */}
            <div className="group relative overflow-hidden rounded-3xl bg-[#07071a] p-8 lg:col-span-2">
              <div className="pointer-events-none absolute -right-8 top-0 h-48 w-48 rounded-full bg-brand-600/20 blur-2xl" />
              <div className="pointer-events-none absolute inset-0 bg-grid-dark" />
              <div className="relative">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/15 text-2xl">
                  🎯
                </div>
                <h3 className="text-xl font-bold text-white">Get Discovered by Employers</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55 max-w-md">
                  Set your profile to public and employers can search you by match percentage for their open roles. Your skills do the talking.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {['80%+ match filter', 'Skill-first search', 'Direct outreach'].map(t => (
                    <span key={t} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/60 backdrop-blur-sm">{t}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Card – Recommendations */}
            <div className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-2xl">
                💡
              </div>
              <h3 className="text-lg font-bold text-gray-900">Actionable Recommendations</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Know exactly what certifications, skills, or experience will close your gap and by how much.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#07071a] py-28">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-brand-600/10 blur-[80px]" />
          <div className="absolute right-1/4 bottom-0 h-80 w-80 rounded-full bg-violet-600/10 blur-[80px]" />
          <div className="absolute inset-0 bg-grid-dark" />
        </div>

        <div className="relative mx-auto max-w-3xl px-6">
          <div className="mb-14 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">Real outcomes</p>
            <h2 className="mt-3 text-4xl font-bold text-white">Who TalentBridge is for</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/50">
              Whether you&apos;re switching careers, hiring your next team, or actively searching — TalentBridge works for you.
            </p>
            {/* Category legend */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {TESTIMONIAL_CATEGORIES.map(({ label, icon, color }) => (
                <span key={label} className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${color} px-3 py-1 text-xs font-semibold text-white/90`}>
                  {icon} {label}
                </span>
              ))}
            </div>
          </div>

          <TestimonialCarousel items={TESTIMONIALS} />
        </div>
      </section>

      {/* ── SPLIT CTA ─────────────────────────────────────────── */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Candidate */}
            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 p-10">
              <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
              <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-violet-500/20 blur-2xl" />
              <p className="relative text-xs font-semibold uppercase tracking-widest text-brand-300">For job seekers</p>
              <h3 className="relative mt-3 text-2xl font-bold text-white">Find where you truly belong</h3>
              <ul className="relative mt-4 space-y-2">
                {CANDIDATE_PERKS.map(i => (
                  <li key={i} className="flex items-center gap-2 text-sm text-white/65">
                    <span className="text-brand-300">✓</span>{i}
                  </li>
                ))}
              </ul>
              <Link
                href="/register?role=CANDIDATE"
                className="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-700 shadow-lg hover:bg-brand-50 transition-colors"
              >
                Start for free →
              </Link>
            </div>

            {/* Employer */}
            <div className="group relative overflow-hidden rounded-3xl border-2 border-gray-200 bg-white p-10">
              <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-brand-50 blur-2xl" />
              <p className="relative text-xs font-semibold uppercase tracking-widest text-brand-600">For employers</p>
              <h3 className="relative mt-3 text-2xl font-bold text-gray-900">Find candidates that actually fit</h3>
              <ul className="relative mt-4 space-y-2">
                {EMPLOYER_PERKS.map(i => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="text-brand-500">✓</span>{i}
                  </li>
                ))}
              </ul>
              <Link
                href="/register?role=EMPLOYER"
                className="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/20 hover:bg-brand-500 transition-colors"
              >
                Start hiring →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ────────────────────────────────────────── */}
      <footer className="relative overflow-hidden bg-[#07071a]">
        {/* CTA block */}
        <div className="relative border-b border-white/8 py-24">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-600/15 blur-[80px]" />
            <div className="absolute inset-0 bg-grid-dark" />
          </div>
          <div className="relative mx-auto max-w-2xl px-6 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to make your move?</h2>
            <p className="mt-4 text-base text-white/50">
              Join candidates using AI to land roles they&apos;re genuinely qualified for.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-brand-600/30 hover:bg-brand-500 transition-all hover:-translate-y-0.5"
            >
              Get started — it&apos;s free
            </Link>
            <p className="mt-6 text-xs text-white/25">
              Already have an account?{' '}
              <Link href="/login" className="text-white/45 underline hover:text-white/70 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer links */}
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌉</span>
            <span className="text-sm font-semibold text-white/50">TalentBridge</span>
          </div>
          <div className="flex gap-6">
            {FOOTER_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="text-xs text-white/30 hover:text-white/60 transition-colors">
                {label}
              </Link>
            ))}
          </div>
          <p className="text-xs text-white/20">© {new Date().getFullYear()} TalentBridge</p>
        </div>
      </footer>

    </main>
  )
}
