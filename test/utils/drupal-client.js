const axios = require('axios');
const FormData = require('form-data');

class DrupalClient {
  constructor() {
    this.baseURL = global.DRUPAL_URL;
    this.accessToken = null;
    this.refreshToken = null;
    this.useOAuth = true; // Can be disabled for basic tests
  }

  async authenticate(clientType = 'viewer') {
    if (!this.useOAuth) {
      // Skip OAuth for basic connectivity tests
      return true;
    }

    const clientId = clientType === 'previewer' ? process.env.DRUPAL_PREVIEW_CLIENT_ID : process.env.DRUPAL_VIEWER_CLIENT_ID;
    const clientSecret = clientType === 'previewer' ? process.env.DRUPAL_PREVIEW_CLIENT_SECRET : process.env.DRUPAL_VIEWER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return false;
    }

    try {
      // Create form data for OAuth request
      const formData = new FormData();
      formData.append('grant_type', 'client_credentials');
      formData.append('client_id', clientId);
      formData.append('client_secret', clientSecret);

      const response = await axios.post(`${this.baseURL}/oauth/token`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;

      return true;
    } catch (error) {
      return false;
    }
  }

  async makeRequest(method, endpoint, data = null, headers = {}, clientType = 'viewer') {
    if (this.useOAuth && !this.accessToken) {
      const authenticated = await this.authenticate(clientType);
      if (!authenticated) {
        throw new Error('Failed to authenticate with Drupal');
      }
    }

    const config = {
      method,
      url: `${this.baseURL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    // Add OAuth token if available
    if (this.useOAuth && this.accessToken) {
      config.headers.Authorization = `Bearer ${this.accessToken}`;
    }

    if (data) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (this.useOAuth && error.response?.status === 401) {
        // Token expired, try to refresh
        const authenticated = await this.authenticate(clientType);
        if (authenticated) {
          // Retry the request
          config.headers.Authorization = `Bearer ${this.accessToken}`;
          const retryResponse = await axios(config);
          return retryResponse.data;
        }
      }
      throw error;
    }
  }

  async get(endpoint) {
    return this.makeRequest('GET', endpoint);
  }

  async post(endpoint, data, headers = {}) {
    return this.makeRequest('POST', endpoint, data, headers);
  }

  async put(endpoint, data) {
    return this.makeRequest('PUT', endpoint, data);
  }

  async delete(endpoint) {
    return this.makeRequest('DELETE', endpoint);
  }

  async createNode(type, data) {
    return this.post(`/node`, {
      type: type,
      title: data.title,
      body: data.body || '',
      status: data.status || 1
    });
  }

  async getNodes(type = null) {
    const endpoint = type ? `/node?type=${type}` : '/node';
    return this.get(endpoint);
  }

  async getGraphQL(query, variables = {}) {
    return this.post('/graphql', {
      query,
      variables
    });
  }

  // Method to disable OAuth for basic connectivity tests
  disableOAuth() {
    this.useOAuth = false;
  }

  // Method to enable OAuth
  enableOAuth() {
    this.useOAuth = true;
  }
}

module.exports = DrupalClient;
