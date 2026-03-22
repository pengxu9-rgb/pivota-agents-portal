/**
 * Developer-facing API configuration.
 *
 * The public API contract should use a branded hostname rather than an
 * infrastructure provider hostname. Production must set NEXT_PUBLIC_API_URL,
 * but we also keep a safe branded default for builds and local validation.
 */

const DEFAULT_PUBLIC_API_BASE_URL = 'https://api.pivota.cc';

function normalizeBaseUrl(value: string | undefined): string {
  const raw = String(value || DEFAULT_PUBLIC_API_BASE_URL).trim().replace(/\/$/, '');
  if (!raw) {
    return DEFAULT_PUBLIC_API_BASE_URL;
  }

  if (/https?:\/\/[^/]+\.up\.railway\.app$/i.test(raw)) {
    return DEFAULT_PUBLIC_API_BASE_URL;
  }

  return raw.replace(/^http:\/\//i, 'https://');
}

export function getPublicApiBaseUrl(): string {
  return normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);
}

export function getApiBaseUrl(): string {
  return getPublicApiBaseUrl();
}

export function getAgentApiV1BaseUrl(): string {
  return `${getPublicApiBaseUrl()}/agent/v1`;
}

export function getBackendDocsBaseUrl(): string {
  return `${getPublicApiBaseUrl()}/docs`;
}

export function getBackendOpenApiUrl(): string {
  return `${getPublicApiBaseUrl()}/openapi.json`;
}

export const API_CONFIG = {
  get BASE_URL() {
    return getPublicApiBaseUrl();
  },
  get AGENT_API_V1_BASE_URL() {
    return getAgentApiV1BaseUrl();
  },
  get DOCS_URL() {
    return getBackendDocsBaseUrl();
  },
  get OPENAPI_URL() {
    return getBackendOpenApiUrl();
  },
  DEFAULT_PUBLIC_API_BASE_URL,
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};
