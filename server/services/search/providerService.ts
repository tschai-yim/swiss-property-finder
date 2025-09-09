import { Property, DebugConfig } from "../../../types";
import {
  PropertyProvider,
  PropertyWithoutCommuteTimes,
  RequestManager,
} from "../providers/providerTypes";

// Import all providers
import { homegateProvider } from "../providers/homegate/provider";
import { comparisProvider } from "../providers/comparis/provider";
import { weegeeProvider } from "../providers/weegee/provider";
import { tuttiProvider } from "../providers/tutti/provider";
import { meinWGZimmerProvider } from "../providers/meinWGZimmer/provider";
import { wgZimmerProvider } from "../providers/wgZimmer/provider";

const ALL_PROVIDERS: PropertyProvider[] = [
  homegateProvider,
  comparisProvider,
  weegeeProvider,
  tuttiProvider,
  meinWGZimmerProvider,
  wgZimmerProvider,
];

/**
 * Gets a list of active property providers based on the debug configuration.
 * If debug mode is off, all providers are returned.
 * @param debugConfig The application's debug configuration.
 * @returns An array of active `PropertyProvider` instances.
 */
export const getActiveProviders = (
  debugConfig: DebugConfig
): PropertyProvider[] => {
  return debugConfig.enabled
    ? ALL_PROVIDERS.filter((p) =>
        debugConfig.enabledProviders.includes(p.name.toLowerCase())
      )
    : ALL_PROVIDERS;
};

/**
 * Creates request manager objects for each active provider to track and limit API calls in debug mode.
 * @param providers An array of active providers.
 * @param debugConfig The application's debug configuration.
 * @returns A dictionary mapping provider names to `RequestManager` objects.
 */
export const createRequestManagers = (
  providers: PropertyProvider[],
  debugConfig: DebugConfig
): { [key: string]: RequestManager } => {
  return providers.reduce(
    (acc, p) => {
      const limit = debugConfig.enabled ? debugConfig.requestLimit : Infinity;
      acc[p.name] = { count: 0, limit };
      return acc;
    },
    {} as { [key: string]: RequestManager }
  );
};

/**
 * Merges multiple asynchronous generators from different providers into a single one.
 * It yields property batches as they become available from any provider, enabling parallel fetching.
 * @param generators An array of async generators, each yielding `Property[]`.
 * @returns A single async generator that yields `Property[]`.
 */
export async function* mergeProviderStreams(
  generators: AsyncGenerator<PropertyWithoutCommuteTimes[]>[]
): AsyncGenerator<PropertyWithoutCommuteTimes[]> {
  const iterators = generators.map((g) => g[Symbol.asyncIterator]());
  const promisesMap = new Map(
    iterators.map((it, index) => [
      index,
      it
        .next()
        .then((result) => ({ ...result, index }))
        .catch((err) => {
          console.error(`Error in provider stream ${index}:`, err);
          // Return a "done" result to remove this generator from processing
          return { value: undefined, done: true, index };
        }),
    ])
  );

  while (promisesMap.size > 0) {
    try {
      const result = await Promise.race(promisesMap.values());
      const { value, done, index } = result;

      // Only yield if there is a value to yield
      if (value && Array.isArray(value) && value.length > 0) {
        yield value;
      }

      if (done) {
        // Remove completed generators from the map
        promisesMap.delete(index);
      } else {
        // Continue with the next value from this generator
        promisesMap.set(
          index,
          iterators[index]
            .next()
            .then((res) => ({ ...res, index }))
            .catch((err) => {
              console.error(`Error in provider stream ${index}:`, err);
              // Return a "done" result to remove this generator from processing
              return { value: undefined, done: true, index };
            })
        );
      }
    } catch (error) {
      console.error("Error in provider stream:", error);
      break; // Exit on unexpected errors
    }
  }
}
