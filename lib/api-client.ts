import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = 'https://web-production-fedb.up.railway.app';

class AgentApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      const token = this.getAuthToken();
      const apiKey = this.getAgentApiKey();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (apiKey) {
        (config.headers as any)['x-api-key'] = apiKey;
      }
      console.log(`🔄 [Agent API] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ [Agent API] ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error(`❌ [Agent API] ${error.response?.status} ${error.config?.url}`);
        const suppressLogout = (error.config?.headers as any)?.['x-no-logout-on-401'] === 'true';
        if (error.response?.status === 401 && typeof window !== 'undefined' && !suppressLogout) {
          this.clearAuth();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('agent_token');
    }
    return null;
  }

  private getAgentApiKey(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('agent_api_key');
    }
    return null;
  }

  private getAgentIdOrEmail(): string | null {
    if (typeof window !== 'undefined') {
      const agentId = localStorage.getItem('agent_id');
      if (agentId) return agentId;
      const userRaw = localStorage.getItem('agent_user');
      if (userRaw) {
        try { const u = JSON.parse(userRaw); return u.agent_id || u.email || null; } catch {}
      }
    }
    return null;
  }

  private clearAuth(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('agent_token');
      localStorage.removeItem('agent_user');
      localStorage.removeItem('agent_id');
      localStorage.removeItem('agent_api_key');
    }
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/signin', { email, password });
    if (response.data.status === 'success' && response.data.token) {
      localStorage.setItem('agent_token', response.data.token);
      localStorage.setItem('agent_user', JSON.stringify(response.data.user));
      const agentId = response.data.user.agent_id || response.data.user.email || response.data.user.id;
      localStorage.setItem('agent_id', agentId);
      
      // Auto-save agent_api_key if backend returns it (only on login)
      if (response.data.agent_api_key) {
        localStorage.setItem('agent_api_key', response.data.agent_api_key);
        console.log('✅ Agent API key auto-saved');
      }
    }
    return response.data;
  }

  async register(data: any) {
    const response = await this.client.post('/api/auth/register', data);
    return response.data;
  }

  async logout() {
    localStorage.removeItem('agent_token');
    localStorage.removeItem('agent_user');
    localStorage.removeItem('agent_id');
    localStorage.removeItem('agent_api_key');
    window.location.href = '/login';
  }

  async getStats(days: number = 30) {
    const response = await this.client.get('/agent/metrics/summary', {
      params: { days },
    });
    return response.data;
  }

  async getAgentHealth() {
    const response = await this.client.get('/agent/health');
    return response.data;
  }

  async getMerchantAuthorizations(includeStats: boolean = false) {
    const agentId = localStorage.getItem('agent_id');
    const response = await this.client.get(`/agents/${agentId}/merchants`, {
      params: { include_stats: includeStats }
    });
    return response.data;
  }

  async getConversionFunnel(days: number = 7) {
    const agentId = this.getAgentIdOrEmail();
    const response = await this.client.get(`/agents/${encodeURIComponent(agentId || '')}/funnel`, {
      params: { days }
    });
    return response.data;
  }

  async getQueryAnalytics() {
    const agentId = this.getAgentIdOrEmail();
    const response = await this.client.get(`/agents/${encodeURIComponent(agentId || '')}/query-analytics`);
    return response.data;
  }

  // Order Management for Agents
  async refundOrder(orderId: string, amount?: number, reason?: string) {
    const apiKey = this.getAgentApiKey();
    const response = await this.client.post(`/agent/v1/orders/${orderId}/refund`, {
      order_id: orderId,
      amount,
      reason,
      restore_inventory: true
    }, { headers: { 'x-api-key': apiKey || '' } });
    return response.data;
  }

  async cancelOrder(orderId: string, reason?: string) {
    const apiKey = this.getAgentApiKey();
    const response = await this.client.post(`/agent/v1/orders/${orderId}/cancel`, {
      reason
    }, { headers: { 'x-api-key': apiKey || '' } });
    return response.data;
  }

  async trackOrder(orderId: string) {
    const apiKey = this.getAgentApiKey();
    const response = await this.client.get(`/agent/v1/orders/${orderId}/track`, {
      headers: { 'x-api-key': apiKey || '' }
    });
    return response.data;
  }

  // Ensure we have an API key; if not, try to fetch and store one
  private async ensureAgentApiKey(): Promise<string> {
    let apiKey = this.getAgentApiKey() || '';
    const isValid = (k: string) => /^ak_(live|test)_[0-9a-f]{64}$/.test(k || '');
    if (isValid(apiKey)) return apiKey;

    const agentId = this.getAgentIdOrEmail();
    if (!agentId) throw new Error('Missing agent identity. Please re-login.');

    // Always create a fresh live key when none/invalid (GET returns masked keys)
    const create = await this.client.post(`/agents/${encodeURIComponent(agentId)}/api-keys`, {
      name: 'Live API Key (auto)'
    }, {
      headers: { 'x-no-logout-on-401': 'true' }
    });
    const newKey = create.data?.key || create.data?.api_key || '';
    if (!isValid(newKey)) {
      throw new Error('Could not provision a valid API key. Please create one in Integration → API Keys.');
    }
    if (typeof window !== 'undefined') localStorage.setItem('agent_api_key', newKey);
    return newKey;
  }

  async getOrders(limit: number = 100) {
    // Always use Agent API and ensure x-api-key exists
    const apiKey = await this.ensureAgentApiKey();

    const response = await this.client.get('/agent/v1/orders', {
      params: { limit },
      headers: {
        'x-api-key': apiKey,
        'x-no-logout-on-401': 'true'
      }
    });

    const raw = response.data?.orders || response.data || [];
    // Normalize to UI shape
    return (Array.isArray(raw) ? raw : []).map((o: any) => ({
      id: o.order_id || o.id,
      order_number: o.order_id || o.id,
      total_amount: parseFloat(o.total || o.amount || 0),
      status: o.status,
      created_at: o.created_at,
      customer_email: o.customer_email || 'Guest',
    }));
  }

  async getProfile() {
    const agentId = localStorage.getItem('agent_id');
    const response = await this.client.get(`/agents/${agentId}`);
    return response.data;
  }

  async updateProfile(data: any) {
    const agentId = localStorage.getItem('agent_id');
    const response = await this.client.put(`/agents/${agentId}`, data);
    return response.data;
  }

  async resetApiKey() {
    const agentId = localStorage.getItem('agent_id');
    const response = await this.client.post(`/agents/${agentId}/reset-api-key`);
    return response.data;
  }

  // New methods for Agent Dashboard
  async getMetricsSummary() {
    const response = await this.client.get('/agent/metrics/summary');
    return response.data;
  }

  async getRecentActivity(limit: number = 5) {
    const response = await this.client.get('/agent/metrics/recent', { params: { limit } });
    return response.data;
  }

  async getAgentTimeline(days: number = 7) {
    const response = await this.client.get('/agent/v1/metrics/timeline', { params: { days } });
    return response.data;
  }

  async getMerchantAuthorizationsLegacy() {
    const agentId = localStorage.getItem('agent_id');
    const response = await this.client.get(`/agents/${agentId}/merchants`);
    return response.data;
  }

  async getApiKeys() {
    const agentId = this.getAgentIdOrEmail();
    const response = await this.client.get(`/agents/${encodeURIComponent(agentId || '')}/api-keys`);
    return response.data;
  }

  async createApiKey() {
    const agentId = this.getAgentIdOrEmail();
    const response = await this.client.post(`/agents/${encodeURIComponent(agentId || '')}/api-keys`);
    return response.data;
  }

  async revokeApiKey(keyId: string) {
    const agentId = this.getAgentIdOrEmail();
    const response = await this.client.delete(`/agents/${encodeURIComponent(agentId || '')}/api-keys/${encodeURIComponent(keyId)}`);
    return response.data;
  }

  async getAgentIdOrEmailForDebug() {
    return this.getAgentIdOrEmail();
  }
}

export const agentApi = new AgentApiClient();



