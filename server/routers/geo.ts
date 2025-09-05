import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { fetchAddressSuggestions, geocodeAddress } from '../services/api/geoApi';

export const geoRouter = router({
  fetchAddressSuggestions: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      return await fetchAddressSuggestions(input);
    }),
  geocodeAddress: publicProcedure
    .input(z.string())
    .mutation(async ({ input }) => {
      return await geocodeAddress(input);
    }),
});
