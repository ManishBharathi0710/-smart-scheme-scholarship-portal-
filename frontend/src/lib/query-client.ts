import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        // Do not retry 4xx client errors
        const maybeStatus = (error as { statusCode?: number })?.statusCode;
        if (maybeStatus && maybeStatus >= 400 && maybeStatus < 500) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 15, // 15 minutes
    },
    mutations: {
      retry: false,
    },
  },
});
