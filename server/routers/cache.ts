import { router, publicProcedure } from '../trpc';
import { cacheService } from '../services/cache';

export const cacheRouter = router({
  cleanup: publicProcedure
    .mutation(async () => {
      await cacheService.cleanup();
    }),
});
