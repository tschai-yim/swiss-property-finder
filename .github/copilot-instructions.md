# Copilot Instructions

This document provides guidance for AI coding agents to effectively contribute to the Swiss Property Finder AI project.

## Architecture Overview

This is a [Next.js](https://nextjs.org/) application using [tRPC](https://trpc.io/) for full-stack typesafe API routes. The frontend is built with [React](https://react.dev/) and [Tailwind CSS](https://tailwindcss.com/). The backend is in Node.js.

**Project History**: This project was originally a client-only React application that has been converted to Next.js. You may find legacy code that was suitable for a client-only context.

-   **Frontend**: The main application lives in `App.tsx`. Components are in `components/`. Pages are in `pages/`.
-   **Backend**: The server entry point is `server.ts`. tRPC routers are in `server/routers/`.
-   **Database**: The project uses `sqlite` for local data storage. Database-related files can be found in `server/db.ts` and the `data/` directory.
-   **External Services**: The application integrates with various external APIs for property data, geographic information, and transportation. These are managed in `server/services/`.

## Developer Workflow

### Getting Started

1.  Install dependencies: `npm install`
2.  Set up your environment: Create a `.env.local` file and add your `GEMINI_API_KEY`.
3.  Run the development server: `npm run dev`. This will start the server in the foreground. For background execution, you can pipe the output to a log file (e.g., `npm run dev > server.log 2>&1 &`).

### Building

-   To build the application for production, run `npm run build`. This is also a good way to check for compilation errors if you cannot run the full application.
-   To start the production server, run `npm run start`.

### Linting

-   To check for code quality and style issues, run `npm run lint`.

### Email Previews

-   To preview emails, run `npm run email`. This will start a local server to preview email templates located in the `emails/` directory.

## Searching the Codebase

When searching, be specific with your queries to avoid searching through `node_modules/` or `.next/` which can return many irrelevant results.

## Key Conventions

-   **tRPC**: The project uses tRPC for API communication. When adding or modifying API endpoints, you will need to edit the corresponding router in `server/routers/` and the `_app.ts` router. The client-side tRPC setup is in `utils/trpc.ts`.
-   **Styling**: [Tailwind CSS](httpss://tailwindcss.com/) is used for styling. Utility classes are preferred over custom CSS.
-   **State Management**: The project uses a combination of React hooks and `@tanstack/react-query` for managing server state.
-   **Environment Variables**: Environment variables are managed in `.env.local` and accessed via `utils/env.ts`.

## Integration Points

-   **Property Data Providers**: The application fetches property data from multiple providers, such as `homegate` and `comparis`. The logic for these providers is located in `server/services/providers/`.
-   **Geo Services**: The application uses external services for geocoding, isochrones, and other geographic calculations. These services are abstracted in `server/services/api/`.
-   **Gemini API**: The Gemini API is used for AI-powered features. The API key is required in the environment variables.
