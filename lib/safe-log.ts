/**
 * Credential-safe error logging.
 *
 * An AxiosError carries `config.headers` (X-API-Key, Authorization: Bearer …),
 * the request body and the full response. Passing one to `console.*` prints all
 * of it. `logError` prints only what is needed to debug a failed call: method,
 * URL path (no query string), HTTP status and the backend's `detail` string.
 * It never prints headers, config, request data or the raw error.
 */

export interface SafeErrorSummary {
  method?: string;
  path?: string;
  status?: number;
  detail?: string;
  code?: string;
  message?: string;
}

const MAX_TEXT = 300;

function clip(value: string): string {
  return value.length > MAX_TEXT ? `${value.slice(0, MAX_TEXT)}…` : value;
}

function pathOnly(url: unknown): string | undefined {
  if (typeof url !== 'string' || url === '') {
    return undefined;
  }
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) {
    try {
      return new URL(url).pathname;
    } catch {
      return undefined;
    }
  }
  return url.split(/[?#]/)[0];
}

export function summarizeError(error: unknown): SafeErrorSummary {
  if (!error || typeof error !== 'object') {
    return typeof error === 'string' ? { message: clip(error) } : {};
  }

  const err = error as {
    message?: unknown;
    code?: unknown;
    config?: { method?: unknown; url?: unknown };
    response?: { status?: unknown; data?: { detail?: unknown } };
  };

  const summary: SafeErrorSummary = {};

  if (typeof err.config?.method === 'string') {
    summary.method = err.config.method.toUpperCase();
  }
  const path = pathOnly(err.config?.url);
  if (path) {
    summary.path = path;
  }
  if (typeof err.response?.status === 'number') {
    summary.status = err.response.status;
  }
  // Only a string detail: FastAPI validation details are arrays that echo the request input.
  const detail = err.response?.data?.detail;
  if (typeof detail === 'string') {
    summary.detail = clip(detail);
  }
  if (typeof err.code === 'string') {
    summary.code = err.code;
  }
  if (typeof err.message === 'string') {
    summary.message = clip(err.message);
  }

  return summary;
}

export function logError(label: string, error: unknown): void {
  console.error(label, summarizeError(error));
}
