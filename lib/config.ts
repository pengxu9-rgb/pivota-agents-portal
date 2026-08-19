/**
 * Developer-facing API configuration.
 *
 * The public API contract should use a branded hostname rather than an
 * infrastructure provider hostname. Production must set NEXT_PUBLIC_API_URL,
 * but we also keep a safe branded default for builds and local validation.
 */

const DEFAULT_PUBLIC_API_BASE_URL = 'https://api.pivota.cc';

function normalizeBaseUrl(value: string | undefined, fallback: string = DEFAULT_PUBLIC_API_BASE_URL): string {
  const raw = String(value || fallback).trim().replace(/\/$/, '');
  if (!raw) {
    return fallback;
  }

  // A PaaS hostname is never the public contract — fall back to THIS surface's branded default, not the
  // REST control plane's (pointing a commerce-door URL at api.pivota.cc would silently break every
  // example on the page).
  if (/https?:\/\/[^/]+\.up\.railway\.app$/i.test(raw)) {
    return fallback;
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

const DEFAULT_COMMERCE_MCP_BASE_URL = 'https://commerce.mcp.pivota.cc';
const DEFAULT_PUBLIC_READ_MCP_BASE_URL = 'https://mcp.pivota.cc';

// Hosted agent doors live on the commerce gateway, a different origin from the REST control plane.
export function getCommerceMcpBaseUrl(): string {
  return normalizeBaseUrl(process.env.NEXT_PUBLIC_COMMERCE_MCP_URL, DEFAULT_COMMERCE_MCP_BASE_URL);
}

export function getPublicReadMcpBaseUrl(): string {
  return normalizeBaseUrl(process.env.NEXT_PUBLIC_PUBLIC_READ_MCP_URL, DEFAULT_PUBLIC_READ_MCP_BASE_URL);
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
  get COMMERCE_MCP_BASE_URL() {
    return getCommerceMcpBaseUrl();
  },
  get PUBLIC_READ_MCP_BASE_URL() {
    return getPublicReadMcpBaseUrl();
  },
  DEFAULT_PUBLIC_API_BASE_URL,
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};
