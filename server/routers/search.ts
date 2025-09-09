import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { streamProperties } from "../services/search/searchOrchestrator";
import { debugConfig } from "../../utils/env";
import { FilterCriteria, Property } from "../../types";
import { PropertyWithoutCommuteTimes } from "../services/providers/providerTypes";

export const searchRouter = router({
  search: publicProcedure
    .input(
      z.object({
        currentFilters: z.custom<FilterCriteria>(),
        excludedProperties: z.custom<PropertyWithoutCommuteTimes[]>(),
      })
    )
    .mutation(async ({ input }) => {
      const { currentFilters, excludedProperties } = input;
      let properties: Property[] = [];
      let metadata = {};
      for await (const event of streamProperties(
        currentFilters,
        debugConfig,
        excludedProperties
      )) {
        if (event.type === "properties") {
          const propMap = new Map(properties.map((p) => [p.id, p]));

          for (const newProp of event.properties) {
            const componentIds = newProp.id.split("+");
            if (componentIds.length > 1) {
              // This is a merged property. Remove its original components.
              componentIds.forEach((id) => propMap.delete(id));
            }
            // Add or replace the property in the map. This handles new, merged, and enriched properties.
            propMap.set(newProp.id, newProp);
          }
          properties = Array.from(propMap.values());
        } else if (event.type === "metadata") {
          metadata = { ...event.metadata, ...metadata };
        }
      }
      return { properties, metadata };
    }),
});
