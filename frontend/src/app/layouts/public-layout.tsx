import { Link, Outlet } from 'react-router-dom';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { buttonVariants } from '@/components/ui/button';
import { useMe } from '@/features/auth/api';

export function PublicLayout() {
  const { data: user } = useMe();

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="relative z-20">
        <div className="container-page flex h-16 items-center justify-between gap-3">
          <Logo />
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            {user ? (
              <Link to="/dashboard" className={buttonVariants({ size: 'sm' })}>
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex h-10 items-center rounded-full border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div id="main-content" className="flex-1">
        <Outlet />
      </div>

      <footer className="border-t">
        <div className="container-page flex flex-col gap-3 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>MyFitness — plan, track, and stay consistent.</p>
          <div className="flex gap-4">
            <Link to="/login" className="hover:text-foreground">
              Log in
            </Link>
            <Link to="/signup" className="hover:text-foreground">
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
