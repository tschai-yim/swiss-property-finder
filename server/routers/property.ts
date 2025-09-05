import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { lazyEnrichProperty } from '../services/search/propertyEnricher';
import { Property } from '../../types';

export const propertyRouter = router({
  enrich: publicProcedure
    .input(z.object({
      property: z.custom<Property>(),
      destinationCoords: z.object({
        lat: z.number(),
        lng: z.number(),
      }),
      shouldQueryPublicTransport: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const { property, destinationCoords, shouldQueryPublicTransport } = input;
      return await lazyEnrichProperty(property, destinationCoords, shouldQueryPublicTransport);
    }),
});
