import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { LogIn } from 'lucide-react';
import { Field } from '@/components/form-field';
import { GradientButton } from '@/components/ui/gradient-button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { applyFieldErrors } from '@/lib/api';
import { loginSchema, type LoginValues } from '@/lib/schemas/auth';
import { useLogin } from './api';
import { formatWait } from '@/lib/utils';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const returnTo = (() => {
    const state = location.state as { from?: string } | null;
    const value = state?.from;
    return value?.startsWith('/') ? value : '/dashboard';
  })();

  const onSubmit = (values: LoginValues) => {
    setFormError(null);
    login.mutate(values, {
      onSuccess: () => {
        toast.success('Welcome back.');
        navigate(returnTo, { replace: true });
      },
      onError: (error) => {
        const apiError = applyFieldErrors(error, setError);
        setFormError(
          apiError.status === 429
            ? `Too many attempts. Try again in ${formatWait(apiError.retryAfterSec ?? 60)}.`
            : apiError.message
        );
      }
    });
  };

  return (
    <section className="container-page flex min-h-[calc(100dvh-12rem)] items-center justify-center py-10">
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold sm:text-3xl">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Pick up where you left off.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="surface space-y-4 p-5 sm:p-7">
          {formError ? (
            <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          ) : null}

          <Field label="Email" htmlFor="login-email" error={errors.email?.message}>
            <Input
              id="login-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={Boolean(errors.email)}
              {...register('email')}
            />
          </Field>

          <Field label="Password" htmlFor="login-password" error={errors.password?.message}>
            <PasswordInput
              id="login-password"
              autoComplete="current-password"
              placeholder="Your password"
              aria-invalid={Boolean(errors.password)}
              {...register('password')}
            />
          </Field>

          <GradientButton type="submit" className="w-full" loading={login.isPending}>
            <LogIn className="h-4 w-4" /> Log in
          </GradientButton>

          <p className="text-center text-sm text-muted-foreground">
            New here?{' '}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}
