// Expo SDK 58 runs Metro from the workspace root in monorepos, so the root
// config re-exports the app's config (which carries the app-specific resolver
// customizations). Other workspaces (web) do not use Metro.
module.exports = require('./apps/mobile/metro.config.js');
