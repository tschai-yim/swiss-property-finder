# Swiss Property Finder

The application helps users find properties in Switzerland by aggregating data from various providers. It includes features like filtering by commute time, excluding properties, and receiving email alerts for new properties.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 22 or later)
- [Yarn](https://yarnpkg.com/)

### Development

1. **Clone the repository:**

   ```sh
   git clone https://github.com/tschai-yim/swiss-property-finder.git
   cd swiss-property-finder
   ```

2. **Install dependencies:**

   ```sh
   yarn
   ```

3. **Set up environment variables:**

   Create a `.env` file and set the [Geoapify](https://www.geoapify.com/) API key:

   ```env
   GEOAPIFY_API_KEY=<your key>
   ```

4. **Run the development server:**

   ```sh
   yarn dev
   ```

   The application will be available at [http://localhost:3000](http://localhost:3000).

## Deployment (Production)

This project can be deployed using Docker.

1. **Start the application:**

   ```sh
   docker compose up -d
   ```

2. **Stop the application:**

   ```sh
   docker compose stop
   ```

## Environment Variables

The following environment variables are used to configure the application:

| Name                                | Description                                                                                          | Development (Host) Default    | Production (Docker) Default |
| :---------------------------------- | :--------------------------------------------------------------------------------------------------- | :---------------------------- | :-------------------------- |
| `SITE_PORT`                         | The port the site will be exposed at. (Docker only)                                                  | `3000`                        | same                        |
| `GEOAPIFY_API_KEY`                  | Your API key for Geoapify services.                                                                  | (required)                    | (required)                  |
| `PROXY_ENABLED`                     | Enables the use of a CORS proxy for some outgoing requests.                                          | `false`                       | same                        |
| `EMAIL_SERVICE`                     | The email service provider (e.g., 'gmail', 'sendgrid').                                              | `generic`                     | same                        |
| `EMAIL_HOST`                        | The hostname of your email server.                                                                   | -                             | same                        |
| `EMAIL_PORT`                        | The port of your email server.                                                                       | `587`                         | same                        |
| `EMAIL_SECURE`                      | Whether to use a secure connection to the email server.                                              | `false`                       | same                        |
| `EMAIL_USER`                        | The username for your email account.                                                                 | -                             | same                        |
| `EMAIL_PASS`                        | The password for your email account.                                                                 | -                             | same                        |
| `EMAIL_FROM`                        | The 'from' address for outgoing emails.                                                              | -                             | same                        |
| `EMAIL_TO`                          | The recipient address for notification emails.                                                       | -                             | same                        |
| `EMAIL_SCHEDULE_TIMES`              | Comma-separated times to send email alerts (e.g., '06:00,12:00,18:00').                              | `06:00,12:00,18:00`           | same                        |
| `EMAIL_SCHEDULE_TIMEZONE`           | The timezone for email scheduling.                                                                   | `Europe/Zurich`               | same                        |
| `DEBUG_EMAIL_IMMEDIATE_CHECK`       | If true, sends an email immediately on startup for debugging.                                        | `false`                       | same                        |
| `DEBUG_EMAIL_LOOKBACK_HOURS`        | The number of hours to look back for the debug email.                                                | `24`                          | same                        |
| `DEBUG_MODE_ENABLED`                | Enables all debug options below.                                                                     | `true`                        | `false`                     |
| `DEBUG_MODE_REQUEST_LIMIT`          | The maximum number of requests to make to property providers in debug mode.                          | `3`                           | same                        |
| `DEBUG_MODE_ENABLED_PROVIDERS`      | Comma-separated list of [providers](server/services/search/providerService.ts) to use in debug mode. | `weegee,tutti.ch,wgzimmer.ch` | same                        |
| `DEBUG_MODE_QUERY_PUBLIC_TRANSPORT` | Whether to query public transport information in debug mode.                                         | `false`                       | same                        |

For the email options see the [Nodemailer Documentation](https://nodemailer.com/smtp).
