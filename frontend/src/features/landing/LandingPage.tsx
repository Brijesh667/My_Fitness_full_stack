import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  Check,
  Dumbbell,
  LineChart,
  Sparkles,
  Timer,
  UtensilsCrossed
} from 'lucide-react';
import { GradientButton } from '@/components/ui/gradient-button';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { MovingBorder } from '@/components/ui/moving-border';
import { Badge } from '@/components/ui/badge';
import LightRays from '@/components/ui/LightRays-TS-TW';
import { TiltCard } from '@/components/tilt-card';
import { CursorGlow } from '@/components/cursor-glow';
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';
import { useWebglSupport } from '@/hooks/use-webgl-support';
import { useMe } from '@/features/auth/api';

const FEATURES = [
  {
    icon: CalendarDays,
    title: 'Plan by muscle, not guesswork',
    text: 'Build a weekly split in minutes. Pick up to four muscles a day, add exercises, and keep the library copy separate from your plan.'
  },
  {
    icon: Timer,
    title: 'Track set by set',
    text: 'A server-side timer keeps gym time honest, even after a refresh. Tick sets, add weight or actual reps, skip what you need.'
  },
  {
    icon: LineChart,
    title: 'See the pattern',
    text: 'Consistency, streaks, muscle completion, weekday habits and simple insights. Plus a diet plan with a grounded assistant.'
  }
];

const STEPS = [
  {
    title: 'Set your week',
    text: 'Choose muscles for each day, then add exercises from the library or your own.'
  },
  {
    title: 'Start today',
    text: 'Open the workout, hit the timer, and tick sets as you go.'
  },
  {
    title: 'Review progress',
    text: 'Check consistency, streak and weak spots. Adjust the plan next week.'
  }
];

function HeroArt() {
  const bars = [28, 44, 36, 58, 72, 64, 88];

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-6 rounded-[2rem] bg-[radial-gradient(60%_60%_at_50%_30%,rgba(190,242,100,0.12),transparent_70%)]" aria-hidden />
      <div className="relative rounded-3xl border bg-card/90 p-4 shadow-2xl backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">This week</p>
            <p className="mt-0.5 text-lg font-semibold">Push / Pull / Legs</p>
          </div>
          <Badge variant="success">3 days set</Badge>
        </div>

        <div className="mt-4 space-y-2">
          {[
            { day: 'Mon', label: 'Chest · Triceps', done: true },
            { day: 'Wed', label: 'Back · Biceps', done: true },
            { day: 'Fri', label: 'Quads · Hamstrings', done: false },
            { day: 'Sat', label: 'Shoulders · Abs', done: false }
          ].map((item) => (
            <div
              key={item.day}
              className="flex items-center gap-3 rounded-xl border bg-background/60 px-3 py-2.5"
            >
              <span className="w-9 text-xs font-medium text-muted-foreground">{item.day}</span>
              <span className="flex-1 text-sm">{item.label}</span>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full ${
                  item.done ? 'bg-primary/20 text-primary' : 'border border-dashed text-muted-foreground'
                }`}
              >
                {item.done ? <Check className="h-3.5 w-3.5" /> : null}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border bg-background/60 p-3">
          <div className="flex items-end justify-between gap-1.5" aria-hidden>
            {bars.map((height, index) => (
              <div
                key={index}
                className="w-full rounded-t-md bg-[linear-gradient(180deg,#bef264,#34d399)]"
                style={{ height: `${height}px`, opacity: 0.5 + index * 0.07 }}
              />
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Illustrative progress preview</p>
        </div>
      </div>
      <div className="absolute -bottom-4 -left-4 hidden rounded-2xl border bg-card/95 p-3 shadow-lg sm:block">
        <div className="flex items-center gap-2 text-xs">
          <Timer className="h-4 w-4 text-primary" />
          <span className="font-medium">Gym time</span>
          <span className="text-muted-foreground">52 min</span>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { data: user } = useMe();
  const reducedMotion = usePrefersReducedMotion();
  const webglSupported = useWebglSupport();
  const primaryTarget = user ? '/dashboard' : '/signup';
  const primaryLabel = user ? 'Go to dashboard' : 'Start tracking';

  const scrollToHow = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <CursorGlow />
      <main className="relative z-10">
      <section className="hero-glow relative overflow-hidden">
        {webglSupported && !reducedMotion ? (
          <div
            className="light-rays-mask pointer-events-none absolute inset-0 z-0 opacity-70"
            aria-hidden="true"
          >
            <LightRays
              raysOrigin="top-center"
              raysColor="#bef264"
              raysSpeed={0.35}
              lightSpread={0.8}
              rayLength={1.5}
              fadeDistance={1.4}
              saturation={0.9}
              followMouse
              mouseInfluence={0.12}
              noiseAmount={0.08}
              distortion={0.02}
            />
          </div>
        ) : null}
        <div className="container-page relative z-10 grid items-center gap-10 pb-16 pt-10 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24">
          <div className="animate-fade-up">
            <Badge variant="outline" className="mb-5 gap-1.5 border-primary/30 bg-primary/5 text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Built for the gym floor
            </Badge>
            <h1 className="max-w-xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Train with a plan.
              <br />
              <span className="text-gradient">Track every set.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              A weekly muscle-wise workout plan, an honest session timer, and diet targets
              that stay in one place. Designed for your phone.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <GradientButton size="lg" onClick={() => navigate(primaryTarget)}>
                {primaryLabel}
                <ArrowRight className="h-4 w-4" />
              </GradientButton>
              <ShimmerButton onClick={scrollToHow}>See how it works</ShimmerButton>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Workouts, progress and diet — no spreadsheet needed.
            </p>
          </div>

          <div className="animate-fade-up lg:pl-6" style={{ animationDelay: '80ms' }}>
            <TiltCard className="rounded-3xl" maxTilt={4}>
              <HeroArt />
            </TiltCard>
          </div>
        </div>
      </section>

      <section className="border-y bg-muted/20 py-16 sm:py-20">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">What it does</p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
              One loop: plan, train, review.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Built to remove the small decisions that make training inconsistent.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {FEATURES.map((feature, index) => {
              const CardBody = (
                <div className="h-full p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <feature.icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.text}</p>
                </div>
              );

              return (
                <TiltCard key={feature.title} className="h-full rounded-2xl">
                  {index === 0 ? (
                    <MovingBorder className="h-full">
                      <div className="h-full rounded-2xl bg-card">{CardBody}</div>
                    </MovingBorder>
                  ) : (
                    <div className="surface h-full">{CardBody}</div>
                  )}
                </TiltCard>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 py-16 sm:py-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">How it works</p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Three steps, then repeat</h2>
          </div>

          <div className="relative mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <TiltCard key={step.title} className="h-full rounded-2xl" maxTilt={5}>
                <div className="surface relative h-full p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-semibold text-primary">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                </div>
              </TiltCard>
            ))}
          </div>

          <TiltCard className="mt-12 rounded-3xl" maxTilt={3}>
          <div className="grid items-center gap-6 rounded-3xl border bg-card p-5 sm:p-8 lg:grid-cols-2">
            <div>
              <Badge variant="muted" className="mb-3">Illustration</Badge>
              <h3 className="text-xl font-semibold sm:text-2xl">A progress view that tells you what to change</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Muscle completion, weekday consistency, an eight-week trend and a heatmap.
                Rest days stay neutral. Insights appear only when there is enough data.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {['Set-level completion', 'Streaks on planned days only', 'Weakest muscle and weekday'].map(
                  (line) => (
                    <li key={line} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" aria-hidden />
                      {line}
                    </li>
                  )
                )}
              </ul>
            </div>

            <div className="rounded-2xl border bg-background/60 p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Consistency</span>
                <span>7 of 9 planned days</span>
              </div>
              <div className="mt-3 flex items-end gap-2" aria-hidden>
                {[44, 60, 30, 72, 85, 58, 92].map((value, index) => (
                  <div key={index} className="flex-1">
                    <div className="rounded-t-md bg-primary/25" style={{ height: `${value}px` }}>
                      <div
                        className="rounded-t-md bg-[linear-gradient(180deg,#bef264,#34d399)]"
                        style={{ height: `${Math.max(10, value * 0.65)}px`, marginTop: `${value * 0.35}px` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-12 gap-1" aria-hidden>
                {Array.from({ length: 48 }).map((_, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-[3px]"
                    style={{
                      background:
                        index % 7 === 3
                          ? 'hsl(var(--muted))'
                          : `rgba(52, 211, 153, ${0.15 + ((index * 7) % 10) / 14})`
                    }}
                  />
                ))}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">Not real user data — layout preview.</p>
            </div>
          </div>
          </TiltCard>
        </div>
      </section>

      <section className="border-t py-16 sm:py-20">
        <div className="container-page">
          <TiltCard className="mx-auto max-w-2xl rounded-3xl" maxTilt={3}>
          <div className="rounded-3xl border bg-[linear-gradient(160deg,rgba(190,242,100,0.08),transparent_60%)] p-6 text-center sm:p-10">
            <Dumbbell className="mx-auto h-8 w-8 text-primary" aria-hidden />
            <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">Your next session starts with a plan</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Set your week, start today, and let the app keep the score.
            </p>
            <div className="mt-6 flex justify-center">
              <GradientButton size="lg" onClick={() => navigate(primaryTarget)}>
                {primaryLabel} <ArrowRight className="h-4 w-4" />
              </GradientButton>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <UtensilsCrossed className="h-3.5 w-3.5" /> Diet targets
              </span>
              <span className="flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5" /> Session timer
              </span>
              <span className="flex items-center gap-1.5">
                <LineChart className="h-3.5 w-3.5" /> Progress insights
              </span>
            </div>
          </div>
          </TiltCard>
        </div>
      </section>
      </main>
    </>
  );
}
