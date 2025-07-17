// Disable SSL verification for local development environment FIRST
// This is necessary for Lando's self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Jest setup file for Drupal Recipe tests
require('dotenv').config({ path: './.env' });
process.env.NODE_ENV = 'test';

// Use DRUPAL_URL from environment if available (set by Lando), otherwise fallback
global.DRUPAL_URL = process.env.DRUPAL_URL || 'https://recipe-apax-decoupled.lndo.site';

// OAuth configuration from environment variables (from .env file)
global.DRUPAL_PREVIEW_CLIENT_ID = process.env.DRUPAL_PREVIEW_CLIENT_ID;
global.DRUPAL_PREVIEW_CLIENT_SECRET = process.env.DRUPAL_PREVIEW_CLIENT_SECRET;

// Increase timeout for Drupal operations
jest.setTimeout(30000); 