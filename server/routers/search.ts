import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { streamProperties } from '../services/search/searchOrchestrator';
import { debugConfig } from '../../utils/env';
import { FilterCriteria, Property } from '../../types';

export const searchRouter = router({
  search: publicProcedure
    .input(z.object({
      currentFilters: z.custom<FilterCriteria>(),
      excludedProperties: z.custom<Property[]>(),
    }))
    .mutation(async ({ input }) => {
      const { currentFilters, excludedProperties } = input;
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
