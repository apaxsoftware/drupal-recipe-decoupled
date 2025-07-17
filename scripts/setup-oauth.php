#!/usr/bin/env drush
<?php

/**
 * Script to set up OAuth consumers for Drupal decoupled authentication.
 * 
 * Usage: lando drush php:script setup-oauth.php
 * 
 * This script creates two OAuth consumers:
 * - A "Previewer" consumer with 'previewer' role
 * - A "Viewer" consumer with 'viewer' role
 * 
 * Outputs environment variables to stdout and user messages to stderr.
 * 
 * When piped to a file, uses tee to show output on CLI and save to file.
 */

use Drupal\Component\Utility\Crypt;
use Drupal\consumers\Entity\Consumer;
use Drupal\Component\Utility\Random;

// Helper function to create keys directory
function createKeysDirectory()
{
  $drupal_root = \Drupal::root();
  $keys_dir = $drupal_root . '/../keys';
  if (!is_dir($keys_dir)) {
    mkdir($keys_dir, 0755, true);
  }
  return $keys_dir;
}

// Helper function to generate OAuth keys
function generateOAuthKeys($keys_dir)
{
  $private_key_path = $keys_dir . '/private.key';
  $public_key_path = $keys_dir . '/public.key';

  if (!file_exists($private_key_path) || !file_exists($public_key_path)) {
    // Use Drupal's OAuth key generator service
    \Drupal::service('simple_oauth.key.generator')->generateKeys($keys_dir);
    fwrite(STDERR, "Generated OAuth keys in $keys_dir\n");
  }
}

// Helper function to create consumer
function createConsumer($label, $role, $user_id = 2)
{
  $random = new Random();
  $client_id = Crypt::randomBytesBase64();
  // Generate client secret without problematic characters for .env files
  $client_secret = $random->name(12, TRUE);

  $consumer = Consumer::create([
    'label' => $label,
    'client_id' => $client_id,
    'secret' => $client_secret,
    'grant_types' => ['client_credentials'],
    'redirect' => '',
    'user_id' => $user_id,
    'confidential' => TRUE,
    'third_party' => FALSE,
    'is_default' => FALSE,
    'scopes' => [$role],
  ]);

  $consumer->save();

  return [
    'client_id' => $client_id,
    'client_secret' => $client_secret,
    'label' => $label,
    'role' => $role,
  ];
}

// Helper function to check if stdout is being piped
function isStdoutPiped()
{
  // Simple check - if we can't detect terminal, assume it's piped
  if (function_exists('posix_isatty')) {
    return !posix_isatty(STDOUT);
  }

  // Fallback: check if we're in a pipe by trying to get terminal size
  if (function_exists('shell_exec')) {
    $tty_size = shell_exec('stty size 2>/dev/null');
    return empty($tty_size);
  }

  // Default to assuming it's piped
  return true;
}

// Helper function to output environment variables with tee if piped
function outputEnvVars($previewer_consumer, $viewer_consumer)
{
  $env_vars = "# Previewer credentials:\n";
  $env_vars .= "DRUPAL_PREVIEW_CLIENT_ID='" . $previewer_consumer['client_id'] . "'\n";
  $env_vars .= "DRUPAL_PREVIEW_CLIENT_SECRET='" . $previewer_consumer['client_secret'] . "'\n";
  $env_vars .= "# Viewer credentials:\n";
  $env_vars .= "DRUPAL_VIEWER_CLIENT_ID='" . $viewer_consumer['client_id'] . "'\n";
  $env_vars .= "DRUPAL_VIEWER_CLIENT_SECRET='" . $viewer_consumer['client_secret'] . "'\n";

  if (isStdoutPiped()) {
    // If piped, write to stderr for display and stdout for file
    fwrite(STDERR, $env_vars);
    echo $env_vars;
  } else {
    // If not piped, just echo normally
    echo $env_vars;
  }
}

// Helper function to clean up existing consumers
function cleanupExistingConsumers()
{
  $consumer_storage = \Drupal::entityTypeManager()->getStorage('consumer');

  // Delete any existing consumers to start fresh including the unused Default.
  $existing_consumers = $consumer_storage->loadMultiple();
  foreach ($existing_consumers as $consumer) {
    fwrite(STDERR, "Deleting existing consumer: " . $consumer->label() . "\n");
    $consumer->delete();
  }
}

// Main execution
try {
  fwrite(STDERR, "Setting up OAuth consumers...\n");

  if (isset($extra) && in_array('--reset', $extra)) {
    fwrite(STDERR, "--reset flag detected: cleaning up existing consumers...\n");
    cleanupExistingConsumers();
  }

  // Create keys directory and generate keys
  $keys_dir = createKeysDirectory();
  generateOAuthKeys($keys_dir);

  // Create consumers
  $previewer_consumer = createConsumer('Previewer', 'previewer');
  $viewer_consumer = createConsumer('Viewer', 'viewer');

  fwrite(STDERR, "Created OAuth consumers successfully\n");
  fwrite(STDERR, "\n");
  fwrite(STDERR, "╔══════════════════════════════════════════════════════════════╗\n");
  fwrite(STDERR, "║                    SAVE THESE CREDENTIALS                    ║\n");
  fwrite(STDERR, "║                    to your .env file                         ║\n");
  fwrite(STDERR, "╚══════════════════════════════════════════════════════════════╝\n");

  // Output environment variables with tee logic
  outputEnvVars($previewer_consumer, $viewer_consumer);
  fwrite(STDERR, "\n");

} catch (Exception $e) {
  fwrite(STDERR, "Error: " . $e->getMessage() . "\n");
  exit(1);
}