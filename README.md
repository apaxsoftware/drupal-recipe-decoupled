# APAX Decoupled Drupal Recipe

A Drupal 11 recipe for extending the `apax/recipe_apax_base` recipe with additional Drupal modules and configurations for a decoupled Drupal setup.

This [Drupal recipe](https://www.drupal.org/docs/extending-drupal/drupal-recipes) is designed to:

- Install the APAX Base recipe (`apax/recipe_apax_base`)
- Install and configure GraphQL Compose for common entities.
- Install and configure Simple OAuth for authentication.
- Install and configure a decoupled preview iframe and inline content editing with Visual Editor.

## Usage

```shell
composer require apax/recipe_apax_decoupled
drush recipe ./path/to/recipe_apax_decoupled
```

## Local Development

This project uses [Lando](https://lando.dev/) for local development. Starting Lando will build and install a containerized Drupal site with this recipe applied.

### Core Commands

- **`lando start`**: Start the development environment.
- **`lando rebuild`**: Reinstall the Drupal site and reapply the recipe. Use this command when you make changes to `recipe.yml` or need a clean slate.
- **`lando export`**: Export configuration changes from the Drupal UI to the `config/` directory in your project.
- **`lando test`**: Run the automated Jest test suite located in the `test/` directory.
- **`lando reset-oauth`**: Generates OAuth clients and keys required for testing. This creates a `test/.env` file with credentials that the test suite uses.

### Testing

The test suite uses Jest and is located in the `test/` directory. To run the tests:

1.  Ensure the development environment is running (`lando start`).
2.  Set up the OAuth clients for the test environment: `lando reset-oauth`
3.  Run the tests: `lando test`

### OAuth Configuration

The recipe automatically configures two OAuth clients with the `client_credentials` grant:

-   **`viewer`**: For general content access.
-   **`previewer`**: For previewing unpublished content.

The `lando reset-oauth` command generates the necessary RSA keys (in the `/keys` directory) and configures the clients in Drupal for local testing.

### AI Assisted Development

This project includes an `AGENTS.md` file that provides general guidelines and context for AI assistants such as Cursor, Claude Code, and Gemini. To use it with your preferred AI assisted development tool, simply symlink or copy the `AGENTS.md` file to the appropriate rules file name for your assistant (e.g., `.cursorrules`, `CLAUDE.md`, `GEMINI.md`).
