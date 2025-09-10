FROM node:22-alpine AS base

ENV NEXT_TELEMETRY_DISABLED 1
WORKDIR /app

# --- Build Stage ---
FROM base AS builder

# Install dependencies
COPY package.json yarn.lock ./
RUN --mount=type=cache,target=/usr/local/share/.cache yarn install --frozen-lockfile

# Build the Next.js application
COPY . .
RUN yarn build

# --- Production Stage ---
FROM base AS production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
VOLUME /app/data

CMD ["./server.js"]
