import { initTRPC } from '@trpc/server';
import { appRouter } from './routers/_app';

const t = initTRPC.create();

export const router = t.router;
export const publicProcedure = t.procedure;

export { appRouter };
export type AppRouter = typeof appRouter;