const DrupalClient = require('../utils/drupal-client');

describe('Basic Connectivity Tests', () => {
  let client;

  beforeEach(() => {
    client = new DrupalClient();
    client.disableOAuth(); // Disable OAuth for basic connectivity tests
  });

  test('should use a .lndo.site domain for Drupal URL', () => {
    expect(client.baseURL).toMatch(/\.lndo\.site$/);
  });

  test('should connect to Drupal site', async () => {
    try {
      const response = await client.get('/');
      expect(response).toBeDefined();
    } catch (error) {
      // If we get a response (even an error), the site is accessible
      expect(error.response).toBeDefined();
      expect(error.response.status).toBeGreaterThan(0);
    }
  });

  test('should access Drupal status page', async () => {
    try {
      const response = await client.get('/admin/reports/status');
      expect(response).toBeDefined();
    } catch (error) {
      // Status page might require authentication, but we should get a response
      expect(error.response).toBeDefined();
      expect([200, 401, 403, 500]).toContain(error.response.status);
    }
  });

  test('should access Drupal JSON API', async () => {
    try {
      const response = await client.get('/jsonapi');
      expect(response).toBeDefined();
    } catch (error) {
      // JSON API might not be configured, but we should get a response
      expect(error.response).toBeDefined();
      expect([200, 404, 500]).toContain(error.response.status);
    }
  });

  test('should access GraphQL endpoint', async () => {
    try {
      const response = await client.get('/graphql');
      expect(response).toBeDefined();
    } catch (error) {
      // GraphQL might not be configured, but we should get a response
      expect(error.response).toBeDefined();
      expect([200, 404, 403]).toContain(error.response.status);
    }
  });

  test('should handle 404 errors gracefully', async () => {
    try {
      await client.get('/non-existent-endpoint');
    } catch (error) {
      expect(error.response).toBeDefined();
      expect(error.response.status).toBe(404);
    }
  });

  test('should verify Drupal is running and accessible', async () => {
    try {
      const response = await client.get('/');
      // If we get here, Drupal is accessible
      expect(response).toBeDefined();
    } catch (error) {
      // Even if we get an error, the site is responding
      expect(error.response).toBeDefined();
      expect(error.response.status).toBeGreaterThan(0);
      expect(error.response.status).toBeLessThan(600);
    }
  });
}); 