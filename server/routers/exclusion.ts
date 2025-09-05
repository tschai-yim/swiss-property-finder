import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { exclusionService } from '../services/exclusionService';
import { Property } from '../../types';

export const exclusionRouter = router({
  getExclusions: publicProcedure
    .query(async () => {
      return await exclusionService.getExclusions();
    }),
  addExclusion: publicProcedure
    .input(z.custom<Property>())
    .mutation(async ({ input }) => {
      await exclusionService.addExclusion(input);
    }),
  removeExclusion: publicProcedure
    .input(z.string())
    .mutation(async ({ input }) => {
      await exclusionService.removeExclusion(input);
    }),
});
