import { Bell, Briefcase, FolderOpen, Settings, Star } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from '../../router-adapter.tsx'
import { BrandLogo } from '../brand/BrandLogo.tsx'
import { routes } from '../../routes.ts'
import { cn } from '../../utils/cn.ts'

const NAV_ITEMS = [
  { to: routes.orders, label: 'الطلبات', icon: Briefcase, forcedActive: true },
  { to: routes.archive, label: 'الأرشيف', icon: FolderOpen, forcedActive: false },
  { to: routes.ratings, label: 'التقييمات', icon: Star, forcedActive: false },
] as const

export function AppShell() {
  const { pathname } = useLocation()
  const ordersOpen = pathname === routes.overview || pathname === routes.orders

  return (
    <div dir="rtl" className="min-h-svh bg-app text-ink">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-elevated focus:px-3 focus:py-2"
      >
        تخطي إلى المحتوى
      </a>
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-line bg-nav px-4 py-2 text-nav-ink shadow-sm sm:px-6">
        <Link to={routes.orders} className="inline-flex items-center gap-2">
          <BrandLogo className="size-11" />
          <span className="text-base font-semibold tracking-tight" dir="ltr">
            Picko
          </span>
        </Link>
        <nav aria-label="التنقل" className="flex items-center gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, forcedActive }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'inline-flex min-h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium transition-colors',
                  (forcedActive && ordersOpen) || isActive
                    ? 'bg-accent text-on-accent shadow-[0_8px_20px_-10px] shadow-accent/70'
                    : 'text-nav-muted hover:bg-ink/5 hover:text-nav-ink',
                )
              }
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-1.5">
          <NavLink
            to={routes.settings}
            aria-label="الإعدادات"
            className={({ isActive }) =>
              cn(
                'inline-flex size-10 items-center justify-center rounded-xl',
                isActive ? 'bg-accent text-on-accent' : 'text-nav-muted hover:bg-ink/5 hover:text-nav-ink',
              )
            }
          >
            <Settings className="size-4.5" aria-hidden="true" />
          </NavLink>
          <button
            type="button"
            aria-label="التنبيهات"
            className="relative inline-flex size-10 items-center justify-center rounded-xl text-nav-muted hover:bg-ink/5 hover:text-nav-ink"
          >
            <Bell className="size-4.5" aria-hidden="true" />
            <span
              aria-hidden="true"
              className="absolute end-2 top-2 size-2 rounded-full bg-bad ring-2 ring-nav"
            />
          </button>
        </div>
      </header>
      <main id="content" className="px-4 pb-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
