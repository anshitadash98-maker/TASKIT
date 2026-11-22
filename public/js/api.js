/**
 * TASKIT API Client (Vanilla JavaScript Fetch Wrapper)
 * Strict Zero-Framework implementation
 */

const API = {
  getToken() {
    return localStorage.getItem('taskora_token') || localStorage.getItem('taskit_token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('taskora_token', token);
      localStorage.setItem('taskit_token', token);
    } else {
      localStorage.removeItem('taskora_token');
      localStorage.removeItem('taskit_token');
    }
  },

  getUser() {
    try {
      const user = localStorage.getItem('taskora_user') || localStorage.getItem('taskit_user');
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  },

  setUser(user) {
    if (user) {
      localStorage.setItem('taskora_user', JSON.stringify(user));
      localStorage.setItem('taskit_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('taskora_user');
      localStorage.removeItem('taskit_user');
    }
  },

  clearAuth() {
    localStorage.removeItem('taskora_token');
    localStorage.removeItem('taskit_token');
    localStorage.removeItem('taskora_user');
    localStorage.removeItem('taskit_user');
  },

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401 && !endpoint.includes('/login') && !endpoint.includes('/register')) {
          this.clearAuth();
          if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
            window.location.href = '/index.html';
          }
        }
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  // Auth endpoints
  async login(email, password, rememberMe) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe })
    });
    if (data.token) this.setToken(data.token);
    if (data.user) this.setUser(data.user);
    return data;
  },

  async register(email, password, fullName) {
    const data = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName })
    });
    if (data.token) this.setToken(data.token);
    if (data.user) this.setUser(data.user);
    return data;
  },

  async getMe() {
    return this.request('/api/auth/me');
  },

  async getConfig() {
    return this.request('/api/auth/config');
  },

  async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } finally {
      this.clearAuth();
      window.location.href = '/index.html';
    }
  },

  // Task Endpoints
  async getTasks(params = {}) {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'ALL') query.set('status', params.status);
    if (params.priority && params.priority !== 'ALL') query.set('priority', params.priority);
    if (params.category && params.category !== 'ALL') query.set('category', params.category);
    if (params.search) query.set('search', params.search);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/api/tasks${queryString}`);
  },

  async getTask(id) {
    return this.request(`/api/tasks/${id}`);
  },

  async getStats() {
    return this.request('/api/tasks/stats');
  },

  async createTask(taskData) {
    return this.request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
  },

  async updateTask(id, taskData) {
    return this.request(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData)
    });
  },

  async patchTask(id, taskData) {
    return this.request(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(taskData)
    });
  },

  async patchTaskStatus(id, status) {
    return this.request(`/api/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  async deleteTask(id) {
    return this.request(`/api/tasks/${id}`, {
      method: 'DELETE'
    });
  },

  // AI Assistant Endpoints
  async getAiStatus() {
    return this.request('/api/ai/status');
  },

  async aiPrioritize(options = {}) {
    return this.request('/api/ai/prioritize', {
      method: 'POST',
      body: JSON.stringify(options)
    });
  },

  async aiPlanDay(options = {}) {
    return this.request('/api/ai/plan-day', {
      method: 'POST',
      body: JSON.stringify(options)
    });
  },

  async aiParseTasks(text) {
    return this.request('/api/ai/parse-tasks', {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  },

  async aiChat(message) {
    return this.request('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  },

  async aiApplyPriority(taskId, newPriority) {
    return this.request('/api/ai/apply-priority', {
      method: 'POST',
      body: JSON.stringify({ taskId, newPriority })
    });
  },

  async aiConfirmTasks(tasks) {
    return this.request('/api/ai/confirm-tasks', {
      method: 'POST',
      body: JSON.stringify({ tasks })
    });
  }
};
