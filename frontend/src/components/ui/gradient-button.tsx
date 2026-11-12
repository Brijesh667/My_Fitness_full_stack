import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Size = 'default' | 'lg' | 'sm';

const sizes: Record<Size, string> = {
  sm: 'h-10 px-4 text-sm',
  default: 'h-12 px-6 text-sm',
  lg: 'h-14 px-8 text-base'
};

export interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  size?: Size;
}

export const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, children, loading, disabled, size = 'default', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold text-zinc-950 shadow-[0_10px_30px_-12px_rgba(52,211,153,0.7)] transition-transform duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60',
        'bg-[linear-gradient(110deg,#d9f99d_0%,#a7f3d0_45%,#34d399_100%)] hover:brightness-105',
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  )
);
GradientButton.displayName = 'GradientButton';
