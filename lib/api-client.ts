/**
 * [Phase 5.6] Agent Portal API Client
 * Connected to real backend APIs
 */

import axios, { AxiosInstance } from 'axios';
import { API_CONFIG } from './config';

class AgentApiClient {
  private client: AxiosInstance;

  constructor() {
    // ALWAYS use HTTPS for Railway backend
    const baseURL = 'https://web-production-fedb.up.railway.app';
    
    console.log('[AgentApiClient] Initializing with HTTPS URL:', baseURL);
    
    this.client = axios.create({
      baseURL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token interceptor
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('agent_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // CRITICAL: Force HTTPS for ALL requests - no exceptions
      // Fix any accidental HTTP URLs
      if (config.url) {
        config.url = config.url.replace(/^http:\/\//i, 'https://');
      }
      if (config.baseURL) {
        config.baseURL = config.baseURL.replace(/^http:\/\//i, 'https://');
      }
      
      // Build the full URL for logging
      const fullUrl = config.baseURL + (config.url || '');
      if (fullUrl.includes('http://')) {
        console.error('[AgentApiClient] ERROR: HTTP detected in URL:', fullUrl);
        // Force fix it
        config.baseURL = config.baseURL?.replace(/^http:\/\//i, 'https://');
        config.url = config.url?.replace(/^http:\/\//i, 'https://');
      }
      
      return config;
    });
  }

  private getStoredUser() {
    if (typeof window === 'undefined') {
      return null;
    }

    const raw = localStorage.getItem('agent_user');
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private getStoredAgentId() {
    if (typeof window === 'undefined') {
      return null;
    }

    return localStorage.getItem('agent_id');
  }

  private getStoredPrimaryApiKey() {
    if (typeof window === 'undefined') {
      return null;
    }

    return localStorage.getItem('agent_api_key');
  }

  private normalizeProfile(agent: any) {
    const storedUser = this.getStoredUser();
    const metadata = agent?.metadata && typeof agent.metadata === 'object' ? agent.metadata : {};

    return {
      ...(agent || {}),
      agent_name: agent?.agent_name || agent?.name || storedUser?.name || '',
      owner_email: agent?.owner_email || agent?.email || storedUser?.email || '',
      company: agent?.company || metadata.company || storedUser?.company || '',
      webhook_url: typeof agent?.webhook_url === 'string' ? agent.webhook_url : '',
      metadata,
    };
  }

  private normalizeApiKeyRecord(record: any, index: number) {
    const rawValue =
      record?.key ||
      record?.api_key ||
      record?.full_key ||
      record?.token ||
      record?.masked_key ||
      record?.key_preview ||
      record?.api_key_prefix ||
      '';

    const status =
      record?.status === 'revoked' || record?.is_active === false || record?.revoked_at
        ? 'revoked'
        : 'active';

    const partial =
      !record?.key &&
      !record?.api_key &&
      !record?.full_key &&
      Boolean(rawValue);

    return {
      id: record?.id || record?.key_id || record?.api_key_id || `key_${index}`,
      name: record?.name || record?.label || record?.key_name || `API Key ${index + 1}`,
      key: rawValue,
      created_at: record?.created_at || record?.createdAt || null,
      last_used: record?.last_used || record?.last_used_at || record?.last_active || null,
      status,
      usage_count:
        Number(record?.usage_count ?? record?.request_count ?? record?.usage ?? 0) || 0,
      partial,
      source: 'api',
    };
  }

  private getSessionFallbackApiKey() {
    const storedKey = this.getStoredPrimaryApiKey();
    if (!storedKey) {
      return null;
    }

    return {
      id: 'session-primary',
      name: 'Primary API Key',
      key: storedKey,
      created_at: null,
      last_used: null,
      status: 'active' as const,
      usage_count: 0,
      partial: false,
      source: 'session' as const,
    };
  }

  // [Phase 5.6] Settlement APIs
  async getSettlements(agentId: string, status?: string) {
    const params = status ? { status } : {};
    const response = await this.client.get(`/agents/${agentId}/settlements`, { params });
    return response.data;
  }

  async getPendingSettlements(agentId: string) {
    const response = await this.client.get(`/agents/${agentId}/settlements/pending`);
    return response.data;
  }

  async calculateSettlement(agentId: string, days: number = 30) {
    const response = await this.client.post(`/agents/${agentId}/settlements/calculate`, null, {
      params: { days }
    });
    return response.data;
  }

  // [Phase 5.6] Integration APIs
  async getIntegrationOverview(agentId: string) {
    const response = await this.client.get(`/agents/${agentId}/integration/overview`);
    return response.data;
  }

  async getRoutingTrace(agentId: string, days: number = 30) {
    const response = await this.client.get(`/agents/${agentId}/integration/routing-trace`, {
      params: { days }
    });
    return response.data;
  }

  // [Phase 5.5] Revenue APIs
  async getRevenueExpectations(agentId: string) {
    const response = await this.client.get(`/agents/${agentId}/revenue/expectations`);
    return response.data;
  }

  async setRevenueExpectations(agentId: string, expectedRate: number, minRate: number) {
    const response = await this.client.put(
      `/agents/${agentId}/revenue/expectations`,
      null,
      { params: { expected_rate: expectedRate, min_acceptable_rate: minRate } }
    );
    return response.data;
  }

  // [Phase 6.2] Get agent details (including agent_type)
  async getAgentDetails(agentId: string) {
    const response = await this.client.get(`/agents/${agentId}`);
    return response.data;
  }

  async getRevenuePolicies(agentId: string) {
    const response = await this.client.get(`/agents/${agentId}/revenue/policies`);
    return response.data;
  }

  async getRevenueEarnings(agentId: string, days: number = 30, currency: string = 'USD') {
    const response = await this.client.get(`/agents/${agentId}/revenue/earnings`, {
      params: { days, currency }
    });
    return response.data;
  }

  // [Phase 5] Routing APIs
  async getRoutingHistory(agentId: string, days: number = 30, limit: number = 10) {
    const response = await this.client.get(`/agents/${agentId}/routing/history`, {
      params: { days, limit }
    });
    return response.data;
  }

  // [Phase 4] Protocol APIs
  async getProtocols(agentId: string) {
    // Browser: go through Next.js proxy to avoid redirect to HTTP
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('agent_token');
      const response = await fetch(`/api/agent/protocols/${agentId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.detail || response.statusText);
      }

      return await response.json();
    }

    const response = await this.client.get(`/agents/${agentId}/protocols`);
    return response.data;
  }

  // [Phase 6] Integration Status API
  async getIntegrationStatus(agentId: string) {
    try {
      const response = await this.client.get(`/agents/${agentId}/integration/overview`);
      const data = response.data || {};
      const protocols = Array.isArray(data.protocols) ? data.protocols : [];

      return {
        api_connected: true,
        connected_merchants: Number(data?.routing?.unique_merchants ?? 0) || 0,
        active_protocols: protocols.filter((item: any) => item?.status === 'active').length,
        last_api_call: data?.last_updated || null,
        last_sync: data?.last_updated || null,
        raw: data,
      };
    } catch (error) {
      console.error('[AgentApiClient] Failed to load integration overview:', error);
      return {
        api_connected: false,
        connected_merchants: 0,
        active_protocols: 0,
        last_api_call: null,
        last_sync: null,
        raw: null,
      };
    }
  }

  // ========== REAL BACKEND APIS (Connected) ==========
  
  // Analytics - Dashboard
  async getMetricsSummary() {
    try {
      const response = await this.client.get('/agent/metrics/summary');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch metrics summary:', error);
      return this.getEmptyMetricsSummary();
    }
  }

  async getAgentTimeline(hours: number = 24) {
    try {
      const response = await this.client.get('/agent/metrics/timeline', { params: { hours } });
    return response.data;
    } catch (error) {
      console.error('Failed to fetch agent timeline:', error);
      return { timeline: [] };
    }
  }

  async getRecentActivity(limit: number = 5) {
    try {
      const response = await this.client.get('/agent/metrics/recent', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
      return {
        activities: [],
        total: 0,
        limit,
      };
    }
  }

  async getConversionFunnel(days: number = 7) {
    try {
      const response = await this.client.get('/agent/v1/analytics/funnel', { params: { days } });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch conversion funnel:', error);
      return {
        orders_initiated: 0,
        payment_attempted: 0,
        orders_completed: 0,
        conversion_rate: 0,
        days,
      };
    }
  }

  async getQueryAnalytics() {
    try {
      const response = await this.client.get('/agent/v1/analytics/queries');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch query analytics:', error);
      return {
        product_searches: 0,
        product_searches_trend: 'stable',
        product_searches_change: 0,
        inventory_checks: 0,
        inventory_checks_trend: 'stable',
        inventory_checks_change: 0,
        price_queries: 0,
        price_queries_trend: 'stable',
        price_queries_change: 0,
      };
    }
  }

  // Auth
  async login(email: string, password: string) {
    try {
      // Call REAL backend login API
      const response = await this.client.post('/agent/account/login', { email, password });
      const data = response.data;
      
      console.log('✅ Agent login response:', data);
      
      // Store tokens - backend returns: {success, token, agent, api_key}
      if (data.success && data.token) {
        localStorage.setItem('agent_token', data.token);
        localStorage.setItem('agent_user', JSON.stringify(data.agent));
        localStorage.setItem('agent_id', data.agent.agent_id);
        if (data.api_key) {
          localStorage.setItem('agent_api_key', data.api_key);
        }
        console.log('✅ Stored agent credentials:', {
          agent_id: data.agent.agent_id,
          has_token: !!data.token,
          has_api_key: !!data.api_key
        });
      }
      
      return data;
    } catch (error: any) {
      console.error('❌ Login failed:', error.response?.data || error.message);
      throw error;
    }
  }

  logout() {
    localStorage.removeItem('agent_token');
    localStorage.removeItem('agent_user');
    localStorage.removeItem('agent_id');
    localStorage.removeItem('agent_api_key');
  }

  // ========== PLACEHOLDER APIS (Not Yet Implemented) ==========

  async getMerchantAuthorizations() {
    // Call real backend API
    try {
      const agentId = localStorage.getItem('agent_id');
      if (!agentId) {
        console.warn('No agent_id found in localStorage');
        return { merchants: [] };
      }
      const response = await this.client.get(`/agents/${agentId}/merchants`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch merchant authorizations:', error);
      return { merchants: [] };
    }
  }

  async getActiveConnections() {
    // TODO: Implement when backend ready
    return { connections: [] };
  }

  async getOrders(limit: number = 50) {
    // Call real backend API - requires X-API-Key
    try {
      const apiKey = localStorage.getItem('agent_api_key');
      const response = await this.client.get('/agent/v1/orders', {
      params: { limit },
        headers: {
          'X-API-Key': apiKey
        }
      });
      return response.data.orders || [];
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      return [];
    }
  }

  async refundOrder(orderId: string) {
    // Call real backend API - requires X-API-Key
    try {
      const apiKey = localStorage.getItem('agent_api_key');
      const response = await this.client.post(`/agent/v1/orders/${orderId}/refund`, {}, {
        headers: { 'X-API-Key': apiKey }
    });
    return response.data;
    } catch (error) {
      console.error('Failed to refund order:', error);
      throw error;
    }
  }

  async cancelOrder(orderId: string) {
    // Call real backend API - requires X-API-Key
    try {
      const apiKey = localStorage.getItem('agent_api_key');
      const response = await this.client.post(`/agent/v1/orders/${orderId}/cancel`, {}, {
        headers: { 'X-API-Key': apiKey }
    });
    return response.data;
    } catch (error) {
      console.error('Failed to cancel order:', error);
      throw error;
    }
  }

  async trackOrder(orderId: string) {
    // Call real backend API - requires X-API-Key
    try {
      const apiKey = localStorage.getItem('agent_api_key');
      const response = await this.client.get(`/agent/v1/orders/${orderId}/track`, {
        headers: { 'X-API-Key': apiKey }
    });
    return response.data;
    } catch (error) {
      console.error('Failed to track order:', error);
      return {
        order_id: orderId,
        fulfillment_status: 'unknown',
        tracking_number: null,
        carrier: 'Not available',
        timeline: [],
      };
    }
  }

  async getApiKeys() {
    try {
      const agentId = this.getStoredAgentId();
      if (!agentId) {
        return { status: 'success', keys: [] };
      }

      const response = await this.client.get(`/agents/${agentId}/api-keys`);
      const data = response.data;

      const records = Array.isArray(data)
        ? data
        : Array.isArray(data?.keys)
          ? data.keys
          : Array.isArray(data?.api_keys)
            ? data.api_keys
            : Array.isArray(data?.data?.keys)
              ? data.data.keys
              : [];

      const normalized = records
        .map((record: any, index: number) => this.normalizeApiKeyRecord(record, index))
        .filter((record: any) => Boolean(record.key));

      if (normalized.length > 0) {
        return { status: 'success', keys: normalized };
      }

      const fallbackKey = this.getSessionFallbackApiKey();
      return {
        status: 'success',
        keys: fallbackKey ? [fallbackKey] : [],
      };
    } catch (error: any) {
      console.error('[AgentApiClient] Failed to get API keys:', error?.response?.status, error?.message);

      const fallbackKey = this.getSessionFallbackApiKey();
      return { status: 'success', keys: fallbackKey ? [fallbackKey] : [] };
    }
  }

  async createApiKey(name: string = 'API Key') {
    try {
      const agentId = localStorage.getItem('agent_id');
      if (!agentId) {
        throw new Error('Agent ID not found');
      }

      const response = await this.client.post(`/agents/${agentId}/api-keys`, {
        name: name
      });
      
      return response.data;
    } catch (error: any) {
      console.error('[AgentApiClient] Failed to create API key:', error);
      throw error;
    }
  }

  async revokeApiKey(keyId: string) {
    try {
      const agentId = localStorage.getItem('agent_id');
      if (!agentId) {
        throw new Error('Agent ID not found');
      }

      const response = await this.client.delete(`/agents/${agentId}/api-keys/${keyId}`);
      return response.data;
    } catch (error: any) {
      console.error('[AgentApiClient] Failed to revoke API key:', error);
      throw error;
    }
  }

  async getProfile() {
    const agentId = this.getStoredAgentId();
    const storedUser = this.getStoredUser();

    if (!agentId) {
      return {
        status: 'success',
        agent: storedUser
          ? this.normalizeProfile({
              agent_name: storedUser.name,
              owner_email: storedUser.email,
              company: storedUser.company,
              webhook_url: '',
            })
          : null,
      };
    }

    try {
      const response = await this.client.get(`/agents/${agentId}`);
      const payload = response.data;
      const normalized = this.normalizeProfile(payload?.agent || payload);

      return {
        status: payload?.status || 'success',
        agent: normalized,
      };
    } catch (error: any) {
      console.error('[AgentApiClient] Failed to load agent profile:', error?.response?.status, error?.message);

      return {
        status: 'success',
        agent: storedUser
          ? this.normalizeProfile({
              agent_name: storedUser.name,
              owner_email: storedUser.email,
              company: storedUser.company,
              webhook_url: '',
            })
          : null,
      };
    }
  }

  async updateProfile(profile: { name: string; email: string; company: string; webhook_url: string }) {
    const agentId = this.getStoredAgentId();
    if (!agentId) {
      throw new Error('Agent ID not found');
    }

    const currentDetails = await this.getAgentDetails(agentId).catch(() => null);
    const currentAgent = currentDetails?.agent || {};
    const currentMetadata =
      currentAgent?.metadata && typeof currentAgent.metadata === 'object'
        ? currentAgent.metadata
        : {};

    const company = profile.company.trim();
    const metadata = {
      ...currentMetadata,
      company: company || null,
    };

    const payload = {
      agent_name: profile.name.trim() || null,
      webhook_url: profile.webhook_url.trim() || null,
      metadata,
    };

    const response = await this.client.put(`/agents/${agentId}`, payload);
    const updatedAgent = this.normalizeProfile({
      ...currentAgent,
      ...payload,
      owner_email: currentAgent.owner_email || profile.email,
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'agent_user',
        JSON.stringify({
          ...(this.getStoredUser() || {}),
          name: updatedAgent.agent_name,
          email: updatedAgent.owner_email,
          company: updatedAgent.company,
        }),
      );
    }

    return {
      ...(response.data || {}),
      status: response.data?.status || 'success',
      agent: updatedAgent,
    };
  }

  async changePassword(passwordData: { current_password: string; new_password: string }) {
    const response = await this.client.post('/api/auth/change-password', passwordData);
    return response.data;
  }

  async forgotPassword(email: string) {
    const response = await this.client.post('/api/auth/forgot-password', { email });
    return response.data;
  }

  async resetApiKey() {
    const agentId = this.getStoredAgentId();
    if (!agentId) {
      throw new Error('Agent ID not found');
    }

    const response = await this.client.post(`/agents/${agentId}/reset-api-key`);
    const data = response.data || {};
    const nextKey = data.new_api_key || data.api_key || data.key || null;

    if (nextKey && typeof window !== 'undefined') {
      localStorage.setItem('agent_api_key', nextKey);
    }

    return {
      ...data,
      status: data.status || 'success',
      new_api_key: nextKey,
    };
  }

  // ========== Helper Methods ==========

  private getEmptyMetricsSummary() {
    return {
      overview: {
        total_requests: 0,
        requests_last_hour: 0,
        requests_last_24h: 0,
        requests_last_7d: 0
      },
      performance: {
        success_rate_24h: 0,
        avg_response_time_ms: 0
      },
      orders: {
        total_orders: 0,
        total_paid_orders: 0,
        total_revenue: 0,
        count_last_24h: 0,
        revenue_last_24h: 0,
        revenue_last_30d: 0
      },
      merchants: {
        total_count: 0
      },
      agents: {
        active_last_24h: 0
      },
      top_endpoints: [],
      errors: []
    };
  }

  // Generic
  async get(url: string, params?: any) {
    const response = await this.client.get(url, { params });
    return response;
  }

  async post(url: string, data?: any) {
    const response = await this.client.post(url, data);
    return response;
  }

  async put(url: string, data?: any, config?: any) {
    const response = await this.client.put(url, data, config);
    return response;
  }

  async patch(url: string, data?: any, config?: any) {
    const response = await this.client.patch(url, data, config);
    return response;
  }
}

export const agentApi = new AgentApiClient();
