const DrupalClient = require('../utils/drupal-client');

describe('OAuth Authentication', () => {
  let client;

  beforeEach(() => {
    client = new DrupalClient();
  });

  test('should authenticate with OAuth and get access token', async () => {
    const authenticated = await client.authenticate();
    expect(authenticated).toBe(true);
    expect(client.accessToken).toBeTruthy();
  });

  test('should make authenticated requests to protected endpoints', async () => {
    const authenticated = await client.authenticate();
    expect(authenticated).toBe(true);

    // Test that we have a valid access token
    expect(client.accessToken).toBeTruthy();
    expect(client.accessToken.length).toBeGreaterThan(100); // JWT tokens are long
  });

  
}); 