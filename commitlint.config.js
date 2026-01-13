/**
 * Commitlint Configuration
 * 
 * Enforces Conventional Commits format:
 * type(scope): description
 * 
 * @see https://www.conventionalcommits.org/
 */

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type must be one of the following
    'type-enum': [
      2,
      'always',
      [
        'feat',      // New feature
        'fix',       // Bug fix
        'docs',      // Documentation changes
        'style',     // Formatting, missing semicolons, etc.
        'refactor',  // Code restructuring without feature/fix
        'perf',      // Performance improvements
        'test',      // Adding/updating tests
        'build',     // Build system or dependencies
        'ci',        // CI configuration
        'chore',     // Maintenance tasks
        'revert',    // Reverting changes
        'wip',       // Work in progress (squash before merge)
      ],
    ],
    // Type must be lowercase
    'type-case': [2, 'always', 'lowercase'],
    // Type cannot be empty
    'type-empty': [2, 'never'],
    // Scope must be lowercase
    'scope-case': [2, 'always', 'lowercase'],
    // Subject cannot be empty
    'subject-empty': [2, 'never'],
    // Subject must start with lowercase
    'subject-case': [2, 'always', 'lower-case'],
    // No period at end of subject
    'subject-full-stop': [2, 'never', '.'],
    // Header max length
    'header-max-length': [2, 'always', 100],
    // Body must have blank line before it
    'body-leading-blank': [2, 'always'],
    // Footer must have blank line before it
    'footer-leading-blank': [2, 'always'],
  },
  // Custom scope validation
  parserPreset: {
    parserOpts: {
      // Valid scopes
      issuePrefixes: ['CG-', '#'],
    },
  },
  // Help message
  helpUrl: 'https://github.com/cgraph-dev/CGraph/blob/main/CONTRIBUTING.md#commit-messages',
};
