// craco.config.js
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { whenDev } = require('@craco/craco'); // 新增

module.exports = {
  devServer: {
    port: 8000,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.plugins = [
        ...webpackConfig.plugins,
        ...whenDev(() => [
          new BundleAnalyzerPlugin({
            analyzerMode: 'static', // 生成 HTML 文件
            openAnalyzer: false, // 关闭构建完成后自动打开浏览器
            defaultSizes: 'stat', // 使用 stats 中的大小，避免读取 build 目录下不存在的旧文件名（如 bundle.js）
          }),
        ]),
      ];
      // webpackConfig.plugins.push(
      //   new BundleAnalyzerPlugin({
      //     analyzerMode: 'static', // 生成 HTML 文件
      //     openAnalyzer: false, // 关闭构建完成后自动打开浏览器
      //     defaultSizes: 'stat', // 使用 stats 中的大小，避免读取 build 目录下不存在的旧文件名（如 bundle.js）
      //   })
      // );
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
