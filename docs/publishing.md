# Publishing to npm

This document contains instructions for publishing the package to npm.

## Steps

1. Make sure you're logged in to npm:
   ```bash
   npm login
   ```

2. Build the package:
   ```bash
   npm run build
   ```

3. Publish to npm:
   ```bash
   npm publish --access public
   ```

   The `--access public` flag is required for scoped packages (those with @username prefix).

4. Once published, users can install it globally:
   ```bash
   npm install -g @kennyfrc/jina-mcp
   ```

   Or run it directly with npx:
   ```bash
   npx -y @kennyfrc/jina-mcp
   ```

## Versioning

To update the version:

1. Update the version in `package.json`
2. Commit your changes
3. Publish the new version:
   ```bash
   npm publish --access public
   ```