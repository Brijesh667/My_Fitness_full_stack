import { lazy, Suspense, useEffect } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { AppLayout } from './layouts/app-layout';
import { PublicLayout } from './layouts/public-layout';
import { ProtectedRoute, PublicOnlyRoute } from './route-guards';
import { PageSkeleton } from '@/components/page-skeleton';
import { Button } from '@/components/ui/button';

const LandingPage = lazy(() => import('@/features/landing/LandingPage'));
const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
const SignupPage = lazy(() => import('@/features/auth/SignupPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));
const PlanPage = lazy(() => import('@/features/plan/PlanPage'));
const DayEditorPage = lazy(() => import('@/features/plan/DayEditorPage'));
const LibraryPage = lazy(() => import('@/features/exercises/LibraryPage'));
const WorkoutPage = lazy(() => import('@/features/workout/WorkoutPage'));
const ExerciseSessionPage = lazy(() => import('@/features/workout/ExerciseSessionPage'));
const ProgressPage = lazy(() => import('@/features/progress/ProgressPage'));
const DietPage = lazy(() => import('@/features/diet/DietPage'));
const DietPlanPage = lazy(() => import('@/features/diet/DietPlanPage'));
const DietAssistantPage = lazy(() => import('@/features/diet/DietAssistantPage'));
const ProfilePage = lazy(() => import('@/features/profile/ProfilePage'));

function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);
  return null;
}

function NotFoundPage() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="mt-2 text-2xl font-semibold">This page does not exist</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The link may be old, or the page may have moved.
      </p>
      <Link to="/dashboard" className="mt-6">
        <Button>Go to dashboard</Button>
      </Link>
    </div>
  );
}

export function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<LandingPage />} />
            <Route element={<PublicOnlyRoute />}>
              <Route path="login" element={<LoginPage />} />
              <Route path="signup" element={<SignupPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="plan" element={<PlanPage />} />
              <Route path="plan/:day" element={<DayEditorPage />} />
              <Route path="exercises" element={<LibraryPage />} />
              <Route path="workout" element={<WorkoutPage />} />
              <Route path="workout/exercise/:planExerciseId" element={<ExerciseSessionPage />} />
              <Route path="progress" element={<ProgressPage />} />
              <Route path="diet" element={<DietPage />} />
              <Route path="diet/plan" element={<DietPlanPage />} />
              <Route path="diet/assistant" element={<DietAssistantPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}
