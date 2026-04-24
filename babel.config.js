// babel.config.js
// NOTE: react-native-reanimated plugin removed intentionally.
// We do NOT use reanimated 4 / worklets. All animations use
// React Native's built-in Animated API which works in Expo Go.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
