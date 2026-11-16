const path = require('path');
const fs = require('fs');
const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('@react-native/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

// @babel/runtime ships as an exports-only package (no `main`, no index.js).
// Metro's default resolution can't enter it, so deep helper imports injected
// by the babel preset fail with "Unable to resolve module". Map them straight
// to their files on disk. Some subpaths are directories (regenerator/), so
// fall back to <sub>/index.js when <sub>.js does not exist.
const babelRuntimeDir = path.dirname(
  require.resolve('@babel/runtime/package.json', { paths: [__dirname] })
);

function resolveBabelRuntimeFile(sub) {
  const withExt = sub.endsWith('.js') ? sub : `${sub}.js`;
  const asFile = path.join(babelRuntimeDir, withExt);
  if (fs.existsSync(asFile)) return asFile;
  return path.join(babelRuntimeDir, sub, 'index.js');
}

// npm workspaces hoist deps to the repo root; Metro only watches the app dir,
// so files in the hoisted node_modules are invisible to the resolver.
const workspaceRoot = path.resolve(__dirname, '../..');

const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    unstable_enablePackageExports: true,
    resolveRequest(context, moduleName, platform) {
      if (moduleName.startsWith('@babel/runtime/')) {
        const sub = moduleName.slice('@babel/runtime/'.length);
        return context.resolveRequest(
          { ...context, resolveRequest: undefined },
          resolveBabelRuntimeFile(sub),
          platform
        );
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

// uniwind styles the beUI components (Tailwind for RN)
const uniwindConfig = withUniwindConfig(mergeConfig(getDefaultConfig(__dirname), config), {
  cssEntryFile: './src/styles/theme.css',
  dtsFile: './src/uniwind.d.ts',
});

module.exports = uniwindConfig;
