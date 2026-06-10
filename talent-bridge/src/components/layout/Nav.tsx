'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clearAuth, getStoredUser } from '@/lib/auth'

interface NavProps {
  links: Array<{ href: string; label: string }>
}

export function Nav({ links }: NavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const user = getStoredUser()

  const handleLogout = () => {
    clearAuth()
    router.push('/login')
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '?'

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <span className="text-xl transition-transform group-hover:scale-110 duration-200">🌉</span>
          <span className="bg-gradient-to-r from-brand-600 to-violet-600 bg-clip-text text-base font-bold text-transparent">
            TalentBridge
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-0.5">
          {links.map((l) => {
            const active = pathname === l.href
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                }`}
              >
                {l.label}
                {active && (
                  <span className="absolute bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-500 to-violet-500" />
                )}
              </Link>
            )
          })}
        </div>

        {/* Right: user chip + logout */}
        <div className="flex items-center gap-2.5 shrink-0">
          {user && (
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50/80 pl-1 pr-3 py-1 transition-colors hover:border-gray-300">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-500 text-[10px] font-bold text-white shadow-sm">
                {initials}
              </div>
              <span className="text-xs text-gray-500 max-w-[140px] truncate">{user.email}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
          >
            Sign out
          </button>
        </div>

      </div>
    </nav>
  )
}
