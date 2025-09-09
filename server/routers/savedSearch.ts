import { router, publicProcedure } from '../trpc';
import { saveSearch, getLatestSearch } from '../services/savedSearchService';
import { FilterCriteriaSchema } from '../../types';

export const savedSearchRouter = router({
  save: publicProcedure
    .input(FilterCriteriaSchema)
    .mutation(async ({ input }) => {
      await saveSearch(input);
      return { success: true };
    }),
  getLatest: publicProcedure
    .query(async () => {
      const filters = await getLatestSearch();
      return filters;
    }),
});
