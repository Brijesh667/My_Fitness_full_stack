import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Apple,
  BarChart3,
  CalendarDays,
  Dumbbell,
  Home,
  type LucideIcon
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { useMe } from '@/features/auth/api';
import { assetUrl, cn, initials } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/plan', label: 'Plan', icon: CalendarDays },
  { to: '/exercises', label: 'Library', icon: Dumbbell },
  { to: '/progress', label: 'Progress', icon: BarChart3 },
  { to: '/diet', label: 'Diet', icon: Apple }
];

function AvatarLink() {
  const { data: user } = useMe();
  return (
    <Link
      to="/profile"
      aria-label="Open profile"
      className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border bg-muted text-sm font-semibold text-muted-foreground"
    >
      {user?.avatarUrl ? (
        <img src={assetUrl(user.avatarUrl) ?? undefined} alt="" className="h-full w-full object-cover" />
      ) : (
        initials(user?.name ?? 'Me')
      )}
    </Link>
  );
}

export function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-[100dvh]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
        <div className="container-page flex h-14 items-center justify-between gap-2">
          <Logo to="/dashboard" />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <AvatarLink />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl">
        <aside aria-label="Primary" className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-56 shrink-0 flex-col gap-1 border-r p-3 lg:flex">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/12 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </NavLink>
          ))}
        </aside>

        <main id="main-content" tabIndex={-1} key={location.pathname} className="min-w-0 flex-1 animate-fade-up pb-nav lg:pb-10">
          <Outlet />
        </main>
      </div>

      <nav aria-label="Bottom navigation" className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur-md lg:hidden">
        <div className="safe-bottom mx-auto grid max-w-md grid-cols-5">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
                      isActive && 'bg-primary/15'
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
