import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Field } from '@/components/form-field';
import { GradientButton } from '@/components/ui/gradient-button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { applyFieldErrors } from '@/lib/api';
import { signupSchema, type SignupValues } from '@/lib/schemas/auth';
import { useSignup } from './api';
import { formatWait } from '@/lib/utils';

export default function SignupPage() {
  const navigate = useNavigate();
  const signup = useSignup();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '' }
  });

  const onSubmit = (values: SignupValues) => {
    setFormError(null);
    signup.mutate(values, {
      onSuccess: () => {
        toast.success('Account created. Set your weekly plan next.');
        navigate('/dashboard', { replace: true });
      },
      onError: (error) => {
        const apiError = applyFieldErrors(error, setError);
        if (apiError.status === 429) {
          setFormError(`Too many attempts. Try again in ${formatWait(apiError.retryAfterSec ?? 60)}.`);
        } else {
          setFormError(apiError.fields ? null : apiError.message);
        }
      }
    });
  };

  return (
    <section className="container-page flex min-h-[calc(100dvh-12rem)] items-center justify-center py-10">
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold sm:text-3xl">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Name, email and password. That is all we need to start.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="surface space-y-4 p-5 sm:p-7">
          {formError ? (
            <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          ) : null}

          <Field label="Name" htmlFor="name" error={errors.name?.message}>
            <Input
              id="name"
              autoComplete="name"
              placeholder="Your name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'name-error' : undefined}
              {...register('name')}
            />
          </Field>

          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
            />
          </Field>

          <Field
            label="Password"
            htmlFor="password"
            error={errors.password?.message}
            hint="8–64 characters, with at least one letter and one number."
          >
            <PasswordInput
              id="password"
              autoComplete="new-password"
              placeholder="Create a password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
              {...register('password')}
            />
          </Field>

          <GradientButton type="submit" className="w-full" loading={signup.isPending}>
            Create account <ArrowRight className="h-4 w-4" />
          </GradientButton>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </p>
        </form>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          {signup.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          Your password is stored as a hash, never as plain text.
        </p>
      </div>
    </section>
  );
}
