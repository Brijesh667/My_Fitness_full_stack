import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { PageSkeleton } from '@/components/page-skeleton';
import { useMe } from '@/features/auth/api';

export function ProtectedRoute() {
  const { data: user, isLoading } = useMe();
  const location = useLocation();

  if (isLoading) return <PageSkeleton />;
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }
  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { data: user, isLoading } = useMe();
  if (isLoading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
