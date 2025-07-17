# Drupal Recipe Decoupled - Test App

This directory contains automated tests for the APAX Decoupled Drupal Recipe. The tests simulate a JavaScript frontend application accessing the Drupal backend via OAuth authentication and GraphQL/REST APIs.

## Test Structure

- `utils/drupal-client.js` - Drupal API client for making authenticated requests
- `tests/` - Individual test files

## Running Tests

### Using Lando (Recommended)

```bash
# Start the Lando environment
lando start

# Run all tests
lando test
```

### Direct Node.js Execution

```bash
# Install dependencies
npm install

# Run tests
npm test
```

## Test Environment

The tests run against a containerized Drupal environment with:

- **Drupal 11** with the APAX Decoupled Recipe installed
- **Simple OAuth** for authentication
- **GraphQL Compose** for GraphQL API
- **Decoupled Preview Iframe** for preview functionality
- **Visual Editor** for inline editing
- **View Unpublished** for accessing draft content

## Test Configuration

Environment variables (set in `.lando.yml`):

- `DRUPAL_URL` - Drupal site URL (default: http://appserver)

## Adding New Tests

1. Create a new test file in the `tests/` directory
2. Import the `DrupalClient` from `utils/drupal-client.js`
3. Use Jest's `describe` and `test` functions
4. Follow the existing patterns for error handling and logging

Example:

```javascript
const DrupalClient = require('../utils/drupal-client');

describe('My New Feature', () => {
  let client;

  beforeEach(async () => {
    client = new DrupalClient();
    await client.authenticate();
  });

  test('should test my new feature', async () => {
    // Your test code here
  });
});
```

## Troubleshooting

### Tests Failing Due to Module Configuration
Some tests may fail if modules aren't fully configured. This is expected behavior - the tests will log informative messages about what's not available.

### Authentication Issues
If OAuth authentication fails, check that:
- The Simple OAuth module is installed
- OAuth clients are configured in Drupal

### Network Issues
If tests can't connect to Drupal:
- Ensure Lando is running (`lando start`)
- Check that the Drupal site is accessible
- Verify the `DRUPAL_URL` environment variable is correct 