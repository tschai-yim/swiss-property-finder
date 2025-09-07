import { createNextApiHandler } from '@trpc/server/adapters/next';
import { appRouter } from '../../../server/routers/_app';
import { createContext } from '../../../server/trpc';
import type { NextApiRequest, NextApiResponse } from 'next';

const trpcHandler = createNextApiHandler({
  router: appRouter,
  createContext,
});

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await trpcHandler(req, res);
};