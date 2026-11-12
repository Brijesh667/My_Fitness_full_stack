import { Link } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ to = '/', className }: { to?: string; className?: string }) {
  return (
    <Link
      to={to}
      className={cn('inline-flex items-center gap-2 rounded-lg font-semibold tracking-tight', className)}
      aria-label="MyFitness home"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#bef264,#34d399)] text-zinc-950">
        <Dumbbell className="h-5 w-5" aria-hidden />
      </span>
      <span className="text-lg">
        My<span className="text-gradient">Fitness</span>
      </span>
    </Link>
  );
}
