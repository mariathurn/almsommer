const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Card art ships as SVG files that expo-image renders directly.
config.resolver.assetExts.push("svg");

module.exports = config;
