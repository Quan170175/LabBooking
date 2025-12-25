// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Thêm 'xlsx' vào danh sách các đuôi file được xem là assets
config.resolver.assetExts.push("xlsx");

module.exports = config;
