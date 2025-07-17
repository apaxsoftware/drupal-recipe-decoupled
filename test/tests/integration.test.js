const DrupalClient = require('../utils/drupal-client');

describe('Integration Tests - Frontend Simulation', () => {
  let client;

  beforeEach(async () => {
    client = new DrupalClient();
    // Authentication is always required for GraphQL requests.
    await client.authenticate();
  });

  test('should complete full authentication and data retrieval flow', async () => {
    // Step 1: Verify OAuth authentication works.
    const oauthClient = new DrupalClient();
    const authenticated = await oauthClient.authenticate();
    expect(authenticated).toBe(true);
    expect(oauthClient.accessToken).toBeTruthy();

    // Step 2: Test GraphQL query with anonymous access
    const graphqlResponse = await client.getGraphQL(`
      query {
        __typename
      }
    `);
    expect(graphqlResponse).toBeDefined();
    expect(graphqlResponse.data).toBeDefined();
    expect(graphqlResponse.data.__typename).toBe('Query');
  });

  test('should query content through GraphQL', async () => {
    // Query for pages
    const response = await client.getGraphQL(`
      query {
        nodePages(first: 10) {
          edges {
            node {
              __typename
              id
              title
              created {
                timestamp
              }
            }
          }
        }
      }
    `);

    expect(response.data).toBeDefined();
    expect(response.data.nodePages).toBeDefined();
    expect(response.data.nodePages).toHaveProperty('edges');
    expect(response.data.nodePages.edges.length).toBeGreaterThanOrEqual(0);
  });

  test('should handle multiple GraphQL requests', async () => {
    // Make multiple GraphQL requests
    const queries = [
      '{ __typename }',
      '{ nodePages(first: 10) { edges { node { id } } } }',
      '{ users(first: 10) { edges { node { id } } } }',
    ];

    for (const query of queries) {
      const response = await client.getGraphQL(query);
      expect(response.data).toBeDefined();
    }
  });

  test('should handle concurrent GraphQL requests like a real frontend', async () => {
    // Simulate multiple concurrent requests from a frontend
    const requests = [
      client.getGraphQL('{ __typename }'),
      client.getGraphQL(`
        query {
          nodePages(first: 5) {
            edges {
              node {
                id
                title
              }
            }
          }
        }
      `),
      client.getGraphQL(`
        query {
          users(first: 5) {
            edges {
              node {
                id
                name
              }
            }
          }
        }
      `)
    ];

    const results = await Promise.all(requests);
    expect(results).toHaveLength(3);

    // All requests should succeed
    results.forEach((result) => {
      expect(result.data).toBeDefined();
    });
  });

  test('should handle GraphQL errors gracefully', async () => {
    // Test invalid GraphQL query
    const response = await client.getGraphQL(`
      query {
        invalidField {
          id
        }
      }
    `);

    // Should return errors array
    expect(response.errors).toBeDefined();
    expect(Array.isArray(response.errors)).toBe(true);
    expect(response.errors.length).toBeGreaterThan(0);
  });

  test('should handle content queries', async () => {
    // Query for published content
    const response = await client.getGraphQL(`
      query {
        nodePages(first: 10) {
          edges {
            node {
              id
              title
              status
            }
          }
        }
      }
    `);

    expect(response.data).toBeDefined();
    expect(response.data.nodePages).toBeDefined();
    expect(response.data.nodePages).toHaveProperty('edges');
  });

  test('should support GraphQL fragments', async () => {
    // Test using GraphQL fragments (if enabled)
    const response = await client.getGraphQL(`
      query {
        nodePages(first: 1) {
          edges {
            node {
              ... on NodePage {
                __typename
                id
                title
                created {
                  timestamp
                }
                changed {
                  timestamp
                }
              }
            }
          }
        }
      }
    `);

    expect(response.data).toBeDefined();
    expect(response.data.nodePages).toBeDefined();
    expect(response.data.nodePages.edges).toBeDefined();
  });

  test('should handle menu queries for navigation', async () => {
    // Query main menu for frontend navigation
    const response = await client.getGraphQL(`
      query {
        menu(name: MAIN) {
          __typename
          id
          name
          items {
            __typename
            id
            title
            url
          }
        }
      }
    `);

    expect(response.data).toBeDefined();
    expect(response.data.menu).toBeDefined();
    expect(response.data.menu.name).toBe('Main navigation');
  });

  test('should maintain session across multiple operations', async () => {
    // Simulate a user session with multiple operations
    const operations = [
      () => client.getGraphQL('{ __typename }'),
      () => client.getGraphQL('{ nodePages(first: 10) { edges { node { id } } } }'),
      () => client.getGraphQL('{ users(first: 10) { edges { node { id } } } }'),
      () => client.getGraphQL('{ menu(name: MAIN) { name } }'),
    ];

    for (const operation of operations) {
      const result = await operation();
      expect(result.data).toBeDefined();
    }
  });

  test('should verify test page exists and has body content', async () => {
    // Query for the test page created during Lando build
    const response = await client.getGraphQL(`
      query {
        nodePages(first: 10) {
          edges {
            node {
              id
              title
              body {
                value
                processed
              }
              status
              created {
                timestamp
              }
            }
          }
        }
      }
    `);

    expect(response.data).toBeDefined();
    expect(response.data.nodePages).toBeDefined();
    expect(response.data.nodePages).toHaveProperty('edges');

    // Find the test page by title
    const previewClient = new DrupalClient();
    await previewClient.authenticate('previewer');
    const testPageResponse = await previewClient.getGraphQL(`
      query {
        nodePages(first: 100) {
          edges {
            node {
              id
              title
              body {
                value
              }
              status
              created {
                timestamp
              }
            }
          }
        }
      }
    `);
    const testPage = testPageResponse.data.nodePages.edges.find(edge => edge.node.title === 'Test Page from Lando Build');

    // Verify the test page exists
    expect(testPage).toBeDefined();
    expect(testPage.node).toBeDefined();
    expect(testPage.node.title).toBe('Test Page from Lando Build');

    // Verify the page has body content
    expect(testPage.node.body).toBeDefined();
    expect(testPage.node.body.value).toBeDefined();
    expect(testPage.node.body.value).toContain(
      'This is a test page created during the Lando build process'
    );

    // Verify the page is unpublished
    expect(testPage.node.status).toBe(false);

    // Verify the page has required fields
    expect(testPage.node.id).toBeDefined();
    expect(testPage.node.created).toBeDefined();
  });
});
