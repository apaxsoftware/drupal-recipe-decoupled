#!/usr/bin/env drush
<?php

/**
 * Script to create OAuth consumers for Drupal decoupled authentication.
 *
 * This script is called by oauth-setup.sh and should not be run directly.
 * Use: lando oauth-setup
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

// Helper function to create consumer
function createConsumer($label, $role, $user_id = 2)
{
  $client_id = Crypt::randomBytesBase64();
  // Generate cryptographically secure secret (URL-safe base64, 32 bytes)
  $client_secret = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');

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

// Helper function to clean up default consumer (created automatically by simple_oauth)
function cleanupDefaultConsumer()
{
  $consumer_storage = \Drupal::entityTypeManager()->getStorage('consumer');

  // Check for and delete the auto-generated "default consumer"
  $default_consumers = $consumer_storage->loadByProperties(['label' => 'default consumer']);
  foreach ($default_consumers as $consumer) {
    fwrite(STDERR, "Removing auto-generated default consumer...\n");
    $consumer->delete();
  }
}

// Parse command-line arguments
$api_user_id = 2; // default fallback
$reset_flag = false;

if (isset($extra) && is_array($extra)) {
  foreach ($extra as $arg) {
    if ($arg === '--reset') {
      $reset_flag = true;
    }
    if (preg_match('/^--uid=(\d+)$/', $arg, $matches)) {
      $api_user_id = intval($matches[1]);
    }
  }
}

// Main execution
try {
  fwrite(STDERR, "Setting up OAuth consumers...\n");

  if ($reset_flag) {
    fwrite(STDERR, "--reset flag detected: cleaning up existing consumers...\n");
    cleanupExistingConsumers();
  } else {
    // Even on first run, clean up the auto-generated default consumer
    cleanupDefaultConsumer();
  }

  // Create consumers
  $previewer_consumer = createConsumer('Previewer', 'previewer', $api_user_id);
  $viewer_consumer = createConsumer('Viewer', 'viewer', $api_user_id);

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