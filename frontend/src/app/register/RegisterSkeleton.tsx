export default function RegisterSkeleton() {
  return (
    <div className="flex min-h-screen">

      {/* Left panel — branding skeleton */}
      <div className="hidden lg:flex lg:w-[46%] flex-col justify-between bg-gradient-to-br from-brand-900 via-brand-800 to-violet-900 p-12 relative overflow-hidden animate-pulse">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-24 -left-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-white/15" />
          <div className="h-5 w-32 rounded bg-white/15" />
        </div>

        <div className="relative">
          {/* Quote */}
          <div className="space-y-3">
            <div className="h-7 w-full rounded bg-white/15" />
            <div className="h-7 w-4/5 rounded bg-white/15" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3.5 w-full rounded bg-white/10" />
            <div className="h-3.5 w-11/12 rounded bg-white/10" />
            <div className="h-3.5 w-3/4 rounded bg-white/10" />
          </div>

          {/* Feature list */}
          <div className="mt-10 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 shrink-0 rounded-lg bg-white/10" />
                <div className="h-3.5 w-48 rounded bg-white/10" />
              </div>
            ))}
          </div>
        </div>

        <div className="relative h-3 w-40 rounded bg-white/10" />
      </div>

      {/* Right panel — form skeleton */}
      <div className="flex flex-1 flex-col justify-center px-8 py-12 sm:px-12 bg-white overflow-y-auto">
        <div className="mx-auto w-full max-w-sm animate-pulse">

          {/* Mobile logo */}
          <div className="mb-10 flex items-center gap-2 lg:hidden">
            <div className="h-6 w-6 rounded-md bg-gray-200" />
            <div className="h-5 w-28 rounded bg-gray-200" />
          </div>

          {/* Heading */}
          <div className="h-7 w-56 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-64 rounded bg-gray-100" />

          <div className="mt-8 space-y-5">
            {/* Role toggle */}
            <div>
              <div className="h-3.5 w-16 rounded bg-gray-100" />
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div className="h-[52px] rounded-xl border-2 border-gray-200 bg-gray-50" />
                <div className="h-[52px] rounded-xl border-2 border-gray-200 bg-gray-50" />
              </div>
            </div>

            {/* Email */}
            <div>
              <div className="h-3.5 w-28 rounded bg-gray-100" />
              <div className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-gray-50" />
            </div>

            {/* Password */}
            <div>
              <div className="h-3.5 w-20 rounded bg-gray-100" />
              <div className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-gray-50" />
            </div>

            {/* Confirm password */}
            <div>
              <div className="h-3.5 w-36 rounded bg-gray-100" />
              <div className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-gray-50" />
            </div>

            {/* Submit button */}
            <div className="h-[50px] w-full rounded-xl bg-gray-200" />
          </div>

          {/* Footer link */}
          <div className="mt-6 flex justify-center gap-1.5">
            <div className="h-3.5 w-32 rounded bg-gray-100" />
            <div className="h-3.5 w-16 rounded bg-gray-100" />
          </div>
        </div>
      </div>

    </div>
  )
}
