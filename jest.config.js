module.exports = {
  preset: '@react-native/jest-preset',
  // The preset's own `transform` only matches .js/.ts/.tsx, so every .jsx
  // file in this codebase (all of them) was silently skipped by babel-jest
  // and failed at test time with "Cannot use import statement outside a
  // module". Jest doesn't deep-merge `transform` with the preset, so this
  // redeclares the asset transformer too instead of just adding jsx.
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp)$': require.resolve(
      '@react-native/jest-preset/jest/assetFileTransformer.js',
    ),
  },
  // Most of this app's native modules (react-navigation, vector-icons,
  // linear-gradient, maps, svg, webview...) ship untranspiled ESM in
  // node_modules, so the whole react-native-* / @react-native* family needs
  // to go through babel-jest too, not just react-native itself.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-.*)/)',
  ],
};
