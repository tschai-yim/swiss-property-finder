import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { streamProperties } from '../services/search/searchOrchestrator';
import { FilterCriteria, DebugConfig, Property } from '../../types';

export const searchRouter = router({
  search: publicProcedure
    .input(z.object({
      currentFilters: z.custom<FilterCriteria>(),
      debugConfig: z.custom<DebugConfig>(),
      excludedProperties: z.custom<Property[]>(),
    }))
    .mutation(async ({ input }) => {
      const { currentFilters, debugConfig, excludedProperties } = input;
      const properties = [];
      let metadata = null;
      for await (const event of streamProperties(currentFilters, debugConfig, excludedProperties)) {
        if (event.type === 'properties') {
          properties.push(...event.properties);
        } else if (event.type === 'metadata') {
          metadata = event.metadata;
        }
      }
      return { properties, metadata };
    }),
});
