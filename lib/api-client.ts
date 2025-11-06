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
      const response = await this.client.get(`/agents/${agentId}/integration-status`);
    return response.data;
    } catch (error) {
      // Return mock data if endpoint doesn't exist yet
      console.log('[AgentApiClient] Integration status endpoint not available, using default');
      return {
        api_connected: true,
        connected_merchants: 3,
        active_protocols: 2,
        last_api_call: new Date().toISOString(),
        last_sync: new Date().toISOString()
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
      // Use the new self-service endpoint that returns full API key
      const response = await this.client.get('/agent/self/api-key');
      const data = response.data;
      
      if (data.status === 'success' && data.api_key) {
        return {
          status: 'success',
          keys: [{
            id: 'primary',
            key: data.api_key,  // Full key from backend
            name: data.name || 'Primary API Key',
            status: 'active' as 'active' | 'revoked',
            created_at: data.created_at || new Date().toISOString(),
            last_used: data.last_active,
            usage_count: data.usage_count || 0
          }]
        };
      }
      
      return { status: 'success', keys: [] };
    } catch (error: any) {
      console.error('[AgentApiClient] Failed to get API keys:', error?.response?.status, error?.message);
      
      // Fallback to mock for development
      if (error?.response?.status === 404) {
        console.log('[AgentApiClient] Using mock API key for development');
        return {
          status: 'success',
          keys: [{
            id: 'mock',
            key: 'ak_live_mock_key_for_development_only',
            name: 'Mock API Key',
            status: 'active' as 'active' | 'revoked',
            created_at: new Date().toISOString(),
            last_used: null,
            usage_count: 0
          }]
        };
      }
      
      return { status: 'success', keys: [] };
    }
  }

  async createApiKey() {
    // TODO: Implement when backend ready
    const mockKey = `ak_live_${Math.random().toString(36).slice(2, 34)}`;
    return {
      status: 'success',
      key_id: `key_${Date.now()}`,
      key: mockKey,
      created_at: new Date().toISOString(),
    };
  }

  async revokeApiKey(keyId: string) {
    // TODO: Implement when backend ready
    return {
      status: 'success',
      key_id: keyId,
      revoked: true,
    };
  }

  async getProfile() {
    // TODO: Implement when backend ready
    const mockProfile = localStorage.getItem('agent_user');
    const agent = mockProfile ? JSON.parse(mockProfile) : null;
    return {
      status: 'success',
      agent: agent
        ? {
            agent_name: agent.name,
            owner_email: agent.email,
            company: 'Demo Company',
            webhook_url: 'https://example.com/webhook',
          }
        : null,
    };
  }

  async updateProfile(profile: { name: string; email: string; company: string; webhook_url: string }) {
    // TODO: Implement when backend ready
    const stored = {
      agent_id: localStorage.getItem('agent_id') || 'agent_demo_portal',
      name: profile.name,
      email: profile.email,
    };
    localStorage.setItem('agent_user', JSON.stringify(stored));
    return {
      status: 'success',
      agent: profile,
    };
  }

  async resetApiKey() {
    // TODO: Implement when backend ready
    const newKey = `ak_live_${Math.random().toString(16).slice(2).padEnd(32, '0')}`;
    localStorage.setItem('agent_api_key', newKey);
    return {
      status: 'success',
      new_api_key: newKey,
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
}

export const agentApi = new AgentApiClient();