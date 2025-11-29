import { ALL_PROVIDERS } from "@/server/services/search/providerService";
import { DebugConfig } from "../types";

const DEFAULT_PROVIDERS = [
  // "Homegate",
  // "Comparis",
  "Weegee",
  "Tutti.ch",
  // "MeinWGZimmer",
  "WGZimmer.ch",
];

const getBoolean = (
  value: string | undefined,
  defaultValue: boolean
): boolean => {
  if (value === undefined) {
    return defaultValue;
  }
  return value.toLowerCase() === "true";
};

const getNumber = (value: string | undefined, defaultValue: number): number => {
  if (value === undefined) {
    return defaultValue;
  }
  const parsed = parseInt(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

const getStringArray = (
  value: string | undefined,
  defaultValue: string[]
): string[] => {
  if (value === undefined) {
    return defaultValue;
  }
  return value.split(",").map((s) => s.trim());
};

export const proxyEnabled = getBoolean(process.env.PROXY_ENABLED, false);

export const emailConfig = {
  service: process.env.EMAIL_SERVICE || "generic",
  host: process.env.EMAIL_HOST,
  port: getNumber(process.env.EMAIL_PORT, 587),
  secure: getBoolean(process.env.EMAIL_SECURE, false),
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS,
  from: process.env.EMAIL_FROM,
  to: process.env.EMAIL_TO,
  scheduleTimes: getStringArray(process.env.EMAIL_SCHEDULE_TIMES, [
    "06:00",
    "12:00",
    "18:00",
  ]),
  scheduleTimezone: process.env.EMAIL_SCHEDULE_TIMEZONE || "Europe/Zurich",
  debugImmediateCheck: getBoolean(
    process.env.DEBUG_EMAIL_IMMEDIATE_CHECK,
    false
  ),
  debugLookbackHours: getNumber(process.env.DEBUG_EMAIL_LOOKBACK_HOURS, 24),
};

export const debugConfig: DebugConfig = getBoolean(
  process.env.DEBUG_MODE_ENABLED,
  true
)
  ? {
      enabled: true,
      requestLimit: getNumber(process.env.DEBUG_MODE_REQUEST_LIMIT, 3),
      enabledProviders: getStringArray(
        process.env.DEBUG_MODE_ENABLED_PROVIDERS,
        DEFAULT_PROVIDERS
      ).map((p) => p.toLowerCase()),
      queryPublicTransport: getBoolean(
        process.env.DEBUG_MODE_QUERY_PUBLIC_TRANSPORT,
        false
      ),
    }
  : {
      enabled: false,
      requestLimit: Infinity,
      enabledProviders: ALL_PROVIDERS.map((p) => p.name.toLowerCase()),
      queryPublicTransport: false,
    };

export const ojpApiKey = process.env.OJP_API_KEY;
