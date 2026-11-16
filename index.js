// Expo SDK 58's dev server resolves the entry from the workspace root in
// monorepos. This shim forwards to the mobile app's real entry.
import './apps/mobile/index';
