import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ThemeProvider, useTheme } from './theme-provider';
import { ServerWakeBanner } from '@/components/server-wake-banner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

function Toasts() {
  const { theme } = useTheme();
  return <Toaster position="top-center" theme={theme} richColors closeButton />;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
        <ServerWakeBanner />
        <Toasts />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
