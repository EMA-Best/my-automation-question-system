// craco.config.js
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  devServer: {
    port: 8000,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  webpack: {
    configure: (webpackConfig) => {
      // 只在开发环境添加 BundleAnalyzerPlugin
      if (webpackConfig.mode === 'development') {
        webpackConfig.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            defaultSizes: 'stat',
          })
        );
      }
      if (webpackConfig.mode === 'production') {
        // 抽离公共代码，只在生成环境
        if (webpackConfig.optimization == null) {
          webpackConfig.optimization = {};
        }
        webpackConfig.optimization.splitChunks = {
          chunks: 'all', // 提取所有类型的chunk，包括异步和同步
          cacheGroups: {
            // 缓存组，用于配置如何分割chunk
            antd: {
              name: 'antd-chunk',
              test: /antd/,
              priority: 100,
            },
            reactDom: {
              name: 'reactDom-chunk',
              test: /react-dom/,
              priority: 99,
            },
            // 第三方包
            vendors: {
              name: 'vendors-chunk',
              test: /node_modules/,
              priority: 98,
            },
          },
        };
      }

      return webpackConfig;
    },
  },
};
