import { DebugConfig } from "../types";

const ALL_PROVIDERS = [
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
  const parsed = parseInt(value, 2);
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

export const debugConfig: DebugConfig = {
  enabled: getBoolean(process.env.DEBUG_MODE_ENABLED, true),
  requestLimit: getNumber(process.env.DEBUG_MODE_REQUEST_LIMIT, 10),
  enabledProviders: getStringArray(
    process.env.DEBUG_MODE_ENABLED_PROVIDERS,
    ALL_PROVIDERS
  ).map((p) => p.toLowerCase()),
  queryPublicTransport: getBoolean(
    process.env.DEBUG_MODE_QUERY_PUBLIC_TRANSPORT,
    false
  ),
};
