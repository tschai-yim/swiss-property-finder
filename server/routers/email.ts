import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { fetchNewPropertiesForEmail } from '../services/email/emailSearchService';
import { FilterCriteria, DebugConfig, StoredExcludedProperty, Property, SearchMetadata } from '../../types';
import ReactDOMServer from 'react-dom/server';
import { NewPropertyAlertEmail } from '../../components/email/templates/NewPropertyAlertEmail';

export const emailRouter = router({
  fetchNewProperties: publicProcedure
    .input(z.object({
      filters: z.custom<FilterCriteria>(),
      debugConfig: z.custom<DebugConfig>(),
      excludedProperties: z.custom<StoredExcludedProperty[]>(),
      daysCutoff: z.number(),
    }))
    .mutation(async ({ input }) => {
      const { filters, debugConfig, excludedProperties, daysCutoff } = input;
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
      const htmlString = ReactDOMServer.renderToStaticMarkup(
        <NewPropertyAlertEmail 
            properties={properties}
            metadata={metadata}
            daysCutoff={daysCutoff}
        />
      );
      return `<!DOCTYPE html>${htmlString}`;
    }),
});