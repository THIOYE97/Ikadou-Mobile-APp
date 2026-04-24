// metro.config.js — Expo SDK 53 (no expo-router)
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Explicit platform list — web uses .web.js before .js
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;