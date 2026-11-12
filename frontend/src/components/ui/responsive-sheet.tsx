import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Drawer } from 'vaul';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';

interface ResponsiveSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function ResponsiveSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className
}: ResponsiveSheetProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !isDesktop) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', onKey);
    window.setTimeout(() => panelRef.current?.focus(), 0);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, isDesktop, onOpenChange]);

  if (!open) return null;

  const header = (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <button
        type="button"
        aria-label="Close"
        onClick={() => onOpenChange(false)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );

  if (!isDesktop) {
    return (
      <Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]" />
          <Drawer.Content
            className={cn(
              'fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] rounded-t-3xl border-t bg-card text-card-foreground outline-none',
              className
            )}
          >
            <Drawer.Title className="sr-only">{title}</Drawer.Title>
            {description ? <Drawer.Description className="sr-only">{description}</Drawer.Description> : null}
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted" aria-hidden />
            <div className="max-h-[85dvh] overflow-y-auto px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4">
              {header}
              {children}
              {footer ? <div className="mt-5">{footer}</div> : null}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-2xl border bg-card p-6 text-card-foreground shadow-2xl',
          className
        )}
      >
        {header}
        {children}
        {footer ? <div className="mt-5">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}
