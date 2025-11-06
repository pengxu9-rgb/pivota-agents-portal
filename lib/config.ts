/**
 * API Configuration
 * Ensures HTTPS is always used for production
 */

// Force HTTPS in production, allow HTTP only for localhost development
export function getApiBaseUrl(): string {
  // Always use HTTPS for Railway backend
  const baseUrl = 'https://web-production-fedb.up.railway.app';
  
  // Remove any trailing slash
  return baseUrl.replace(/\/$/, '');
}

// Use getter to ensure URL is computed at runtime, not module load time
export const API_CONFIG = {
  get BASE_URL() {
    return getApiBaseUrl();
  },
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};
