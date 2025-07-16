const axios = require('axios');
const FormData = require('form-data');

class DrupalClient {
  constructor() {
    this.baseURL = global.DRUPAL_URL;
    this.accessToken = null;
    this.refreshToken = null;
    this.useOAuth = true; // Can be disabled for basic tests
  }

  async authenticate() {
    if (!this.useOAuth) {
      // Skip OAuth for basic connectivity tests
      return true;
    }

    const client_id = process.env.DRUPAL_PREVIEW_CLIENT_ID || global.DRUPAL_PREVIEW_CLIENT_ID;
    const client_secret = process.env.DRUPAL_PREVIEW_CLIENT_SECRET || global.DRUPAL_PREVIEW_CLIENT_SECRET;

    if (!client_id || !client_secret) {
      return false;
    }

    try {
      // Get OAuth tokens using client_credentials grant type with FormData
      const formData = new FormData();
      formData.append('grant_type', 'client_credentials');
      formData.append('client_id', client_id);
      formData.append('client_secret', client_secret);

      const tokenResponse = await axios.post(`${this.baseURL}/oauth/token`, formData, {
        headers: {
          'Accept': 'application/json',
          ...formData.getHeaders()
        }
      });

      this.accessToken = tokenResponse.data.access_token;
      this.refreshToken = tokenResponse.data.refresh_token;

      return true;
    } catch (error) {
      return false;
    }
  }

  async makeRequest(method, endpoint, data = null, headers = {}) {
    if (this.useOAuth && !this.accessToken) {
      const authenticated = await this.authenticate();
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
        const authenticated = await this.authenticate();
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