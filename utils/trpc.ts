import { httpBatchLink, httpSubscriptionLink, splitLink } from '@trpc/client';
import { createTRPCNext } from '@trpc/next';
import type { AppRouter } from '../server/trpc';

function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return '';
  }
  // assume localhost
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export const trpc = createTRPCNext<AppRouter>({
  config() {
    const baseUrl = getBaseUrl();
    return {
      links: [
        splitLink({
          condition(op) {
            return op.type === 'subscription';
          },
          true: httpSubscriptionLink({
            url: `${baseUrl}/api/trpc`,
          }),
          false: httpBatchLink({
            url: `${baseUrl}/api/trpc`,
          }),
        }),
      ],
    };
  },
  ssr: false,
});
