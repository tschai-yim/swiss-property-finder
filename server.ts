import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { appRouter } from './server/routers/_app';
import { createNextApiHandler } from '@trpc/server/adapters/next';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createContext } from './server/trpc'; // Import createContext

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const trpcHandler = createNextApiHandler({
  router: appRouter,
  createContext, // Use the imported createContext
});

app.prepare().then(() => {
  createServer(async (req, res) => {
    const parsedUrl = parse(req.url!, true);
    const { pathname, query } = parsedUrl;

    if (pathname?.startsWith('/api/trpc')) {
      // Manually create a NextApiRequest-like object
      const nextApiReq: NextApiRequest = Object.assign(req, {
        query: query,
        cookies: req.headers.cookie ? parse(req.headers.cookie) : {},
        body: undefined, // Body will be parsed by tRPC
        env: process.env, // Pass process.env
      });
      return trpcHandler(nextApiReq, res as NextApiResponse);
    }

    await handle(req, res, parsedUrl);
  }).listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});