import { router } from '../trpc';
import { geoRouter } from './geo';
import { exclusionRouter } from './exclusion';
import { cacheRouter } from './cache';
import { propertyRouter } from './property';
import { searchRouter } from './search';
import { emailRouter } from './email';

export const appRouter = router({
  geo: geoRouter,
  exclusion: exclusionRouter,
  cache: cacheRouter,
  property: propertyRouter,
  search: searchRouter,
  email: emailRouter,
});

export type AppRouter = typeof appRouter;