## APAX Decoupled Drupal Recipe

A Drupal 10 recipe for extending the [apax/recipe_apax_base](https://github.com/apaxsoftware/drupal-recipe-base) recipe with additional Drupal modules and configurations for a decoupled Drupal setup.

This [Drupal recipe](https://www.drupal.org/docs/extending-drupal/drupal-recipes) is designed to:

- Install the APAX Base recipe
- Install and configure GraphQL Compose for common entities
- Install and configure Simple OAuth for authentication
- Install and configure Visual Editor for inline editorial experience

## Usage

```shell
composer require apax/recipe_apax_decoupled
drush recipe ./path/to/recipe_apax_decoupled
```

## Local Development

This project uses Lando for local development. Starting Lando from inside this project will build
and install a containerized Drupal site with this recipe applied. You can start Lando with the
following command:

```shell
lando start
```

Reinstall the site and reapply the recipe with the following command:

```shell
lando rebuild
```

## Local Development

This project uses Lando for local development. Starting Lando will install containerized Drupal site with the recipe
applied. You can start Lando with the following command:

```shell
lando start
```

Reinstall the site and reapply the recipe with the following command:

```shell
lando rebuild
```