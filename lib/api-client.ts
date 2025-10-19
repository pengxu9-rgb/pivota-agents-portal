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
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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
        if (error.response?.status === 401 && typeof window !== 'undefined') {
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

  private clearAuth(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('agent_token');
      localStorage.removeItem('agent_user');
      localStorage.removeItem('agent_id');
    }
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/signin', { email, password });
    if (response.data.status === 'success' && response.data.token) {
      localStorage.setItem('agent_token', response.data.token);
      localStorage.setItem('agent_user', JSON.stringify(response.data.user));
      localStorage.setItem('agent_id', response.data.user.agent_id || response.data.user.id);
    }
    return response.data;
  }

  async register(data: any) {
    const response = await this.client.post('/api/auth/register', data);
    return response.data;
  }

  async logout() {
    this.clearAuth();
    window.location.href = '/login';
  }

  async getStats(days: number = 30) {
    const agentId = localStorage.getItem('agent_id');
    const response = await this.client.get(`/agents/${agentId}/analytics`, {
      params: { days },
    });
    return response.data;
  }

  async getOrders(limit: number = 10) {
    const response = await this.client.get('/orders', { params: { limit } });
    return response.data;
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
}

export const agentApi = new AgentApiClient();

