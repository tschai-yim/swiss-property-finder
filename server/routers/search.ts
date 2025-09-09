import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { streamProperties } from "../services/search/searchOrchestrator";
import { debugConfig } from "../../utils/env";
import { FilterCriteria } from "../../types";
import { PropertyWithoutCommuteTimes } from "../services/providers/providerTypes";

export const searchRouter = router({
  search: publicProcedure
    .input(
      z.object({
        currentFilters: z.custom<FilterCriteria>(),
        excludedProperties: z.custom<PropertyWithoutCommuteTimes[]>(),
      })
    )
    .subscription(({ input }) => {
      const { currentFilters, excludedProperties } = input;
      // Directly return the async generator
      return streamProperties(
        currentFilters,
        debugConfig,
        excludedProperties
      );
    }),
});
