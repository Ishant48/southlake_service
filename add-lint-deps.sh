#!/usr/bin/env bash
# Run once after `npm install` to add ESLint + Prettier devDependencies.
# Delete this file after running.
npm install --save-dev \
  eslint@^9 \
  @eslint/js@^9 \
  typescript-eslint@^8 \
  eslint-plugin-prettier@^5 \
  eslint-config-prettier@^9 \
  prettier@^3 \
  lint-staged@^15

echo ""
echo "Lint deps installed. Add the following scripts to package.json if not already present:"
echo '  "lint":        "eslint . --max-warnings 0",'
echo '  "lint:fix":    "eslint . --fix",'
echo '  "format":      "prettier --write \"src/**/*.ts\"",'
echo '  "format:check":"prettier --check \"src/**/*.ts\""'
