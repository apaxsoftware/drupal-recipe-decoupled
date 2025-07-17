#!/usr/bin/env drush
<?php

/**
 * Script to remove uuid and _core keys from all YAML files in .config-export directory.
 * 
 * Usage: lando drush php:script clean-config-export.php
 * 
 * This script uses Drupal's YAML parsing to safely remove the uuid and _core
 * keys from all configuration export files, making them suitable for version control.
 */

use Drupal\Core\Serialization\Yaml;

$config_export_dir = '/var/www/recipe/.config-export';

if (!is_dir($config_export_dir)) {
  echo "[error] Directory {$config_export_dir} does not exist.\n";
  return;
}

$yaml_files = glob($config_export_dir . '/*.yml');

if (empty($yaml_files)) {
  echo "[warning] No YAML files found in {$config_export_dir}.\n";
  return;
}

$processed_count = 0;
$modified_count = 0;

foreach ($yaml_files as $file_path) {
  $processed_count++;

  try {
    // Read the YAML file
    $content = file_get_contents($file_path);
    if ($content === false) {
      echo "[warning] Could not read file: {$file_path}\n";
      continue;
    }

    // Parse YAML content
    $data = Yaml::decode($content);

    if (!is_array($data)) {
      echo "[warning] Invalid YAML structure in file: {$file_path}\n";
      continue;
    }

    $modified = false;

    // Remove uuid key if it exists
    if (isset($data['uuid'])) {
      unset($data['uuid']);
      $modified = true;
      echo "[info] Removed uuid from: {$file_path}\n";
    }

    // Remove _core key if it exists
    if (isset($data['_core'])) {
      unset($data['_core']);
      $modified = true;
      echo "[info] Removed _core from: {$file_path}\n";
    }

    // Write back to file if modified
    if ($modified) {
      $new_content = Yaml::encode($data);
      if (file_put_contents($file_path, $new_content) === false) {
        echo "[error] Could not write to file: {$file_path}\n";
      } else {
        $modified_count++;
      }
    }

  } catch (Exception $e) {
    echo "[error] Error processing file {$file_path}: " . $e->getMessage() . "\n";
  }
}

echo "[success] Processed {$processed_count} files, modified {$modified_count} files.\n";