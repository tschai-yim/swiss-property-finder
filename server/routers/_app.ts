import { router } from '../trpc';
import { geoRouter } from './geo';
import { exclusionRouter } from './exclusion';
import { cacheRouter } from './cache';
import { propertyRouter } from './property';
import { searchRouter } from './search';
import { emailRouter } from './email';
import { savedSearchRouter } from './savedSearch';

export const appRouter = router({
  geo: geoRouter,
  exclusion: exclusionRouter,
  cache: cacheRouter,
  property: propertyRouter,
  search: searchRouter,
  email: emailRouter,
  savedSearch: savedSearchRouter,
});

export type AppRouter = typeof appRouter;