const DrupalClient = require('../utils/drupal-client');

describe('GraphQL API', () => {
  let client;

  beforeEach(async () => {
    client = new DrupalClient();
    // Authentication is always required for GraphQL requests.
    await client.authenticate();
  });

  test('should access GraphQL endpoint', async () => {
    const query = `
      query {
        __typename
      }
    `;

    const response = await client.getGraphQL(query);
    expect(response).toBeDefined();
    expect(response.data).toBeDefined();
    expect(response.data.__typename).toBe('Query');
  });

  test('should query for nodes', async () => {
    const query = `
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
    `;

    const response = await client.getGraphQL(query);
    expect(response).toBeDefined();
    expect(response.data).toBeDefined();
    // Even if no nodes exist, the query structure should be valid
    expect(response.data.nodePages).toBeDefined();
    expect(response.data.nodePages).toHaveProperty('edges');
    expect(Array.isArray(response.data.nodePages.edges)).toBe(true);
  });

  test('should query for users', async () => {
    const query = `
      query {
        users(first: 10) {
          edges {
            node {
              __typename
              id
              name
            }
          }
        }
      }
    `;

    const response = await client.getGraphQL(query);
    expect(response).toBeDefined();
    expect(response.data).toBeDefined();
    expect(response.data.users).toBeDefined();
    expect(response.data.users).toHaveProperty('edges');
    expect(Array.isArray(response.data.users.edges)).toBe(true);
    // Should have at least one user (admin)
    expect(response.data.users.edges.length).toBeGreaterThan(0);
  });

  test('should query for menus', async () => {
    const query = `
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
    `;

    const response = await client.getGraphQL(query);
    expect(response).toBeDefined();
    expect(response.data).toBeDefined();
    // Main menu should exist
    expect(response.data.menu).toBeDefined();
    expect(response.data.menu.name).toBe('Main navigation');
  });

  test('should handle GraphQL errors gracefully', async () => {
    const invalidQuery = `
      query {
        invalidField {
          id
        }
      }
    `;

    const response = await client.getGraphQL(invalidQuery);
    // Should return errors array
    expect(response.errors).toBeDefined();
    expect(Array.isArray(response.errors)).toBe(true);
    expect(response.errors.length).toBeGreaterThan(0);
  });
});