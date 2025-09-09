import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { fetchNewPropertiesForEmail } from '../services/email/emailSearchService';
import { debugConfig } from '../../utils/env';
import { FilterCriteria, Property, SearchMetadata } from '../../types';
import { renderEmailTemplate } from '../utils/renderEmail';
import { PropertyWithoutCommuteTimes } from '../services/providers/providerTypes';

export const emailRouter = router({
  fetchNewProperties: publicProcedure
    .input(z.object({
      filters: z.custom<FilterCriteria>(),
      excludedProperties: z.custom<PropertyWithoutCommuteTimes[]>(),
      daysCutoff: z.number(),
    }))
    .mutation(async ({ input }) => {
      const { filters, excludedProperties, daysCutoff } = input;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysCutoff);
      cutoffDate.setHours(0, 0, 0, 0);
      return await fetchNewPropertiesForEmail(filters, debugConfig, excludedProperties, cutoffDate, () => {});
    }),
  renderEmailTemplate: publicProcedure
    .input(z.object({
      properties: z.custom<Property[]>(),
      metadata: z.custom<SearchMetadata>(),
      daysCutoff: z.number(),
    }))
    .mutation(async ({ input }) => {
      const { properties, metadata, daysCutoff } = input;
      return renderEmailTemplate(properties, metadata, daysCutoff);
    }),
});
