import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { lazyEnrichProperty } from '../services/search/propertyEnricher';
import { Property } from '../../types';
import { PropertyWithoutCommuteTimes } from '../services/providers/providerTypes';

export const propertyRouter = router({
  enrich: publicProcedure
    .input(z.object({
      property: z.custom<Property | PropertyWithoutCommuteTimes>(),
      destinationCoords: z.object({
        lat: z.number(),
        lng: z.number(),
      }),
    }))
    .mutation(async ({ input }) => {
      const { property, destinationCoords } = input;
      return await lazyEnrichProperty(property, destinationCoords);
    }),
});
