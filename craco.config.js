const JavaScriptObfuscator = require('webpack-obfuscator');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Only apply in production
      if (env === 'production') {
        // SECURITY: Disable source maps completely to prevent source code exposure in dev tools
        webpackConfig.devtool = false;
        
        // Remove source map generation from all plugins
        if (webpackConfig.plugins) {
          webpackConfig.plugins = webpackConfig.plugins.map(plugin => {
            if (plugin && plugin.constructor && plugin.constructor.name === 'SourceMapDevToolPlugin') {
              return null;
            }
            return plugin;
          }).filter(Boolean);
        }

        // Add JavaScript Obfuscator
        webpackConfig.plugins.push(
          new JavaScriptObfuscator({
            rotateStringArray: true,
            stringArray: true,
            stringArrayThreshold: 0.75,
            stringArrayEncoding: ['base64'],
            splitStrings: true,
            splitStringsChunkLength: 10,
            identifierNamesGenerator: 'hexadecimal',
            renameGlobals: true,
            selfDefending: true,
            deadCodeInjection: true,
            deadCodeInjectionThreshold: 0.4,
            debugProtection: true,
            debugProtectionInterval: 2000,
            disableConsoleOutput: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 0.75,
            transformObjectKeys: true,
            compact: true,
            simplify: true,
            numbersToExpressions: true,
            stringArrayWrappersCount: 2,
            stringArrayWrappersChainedCalls: true,
            stringArrayWrappersParametersMaxCount: 4,
            stringArrayWrappersType: 'function',
            unicodeEscapeSequence: true,
            sourceMap: false, // Explicitly disable source maps in obfuscator
            sourceMapMode: 'separate'
          }, ['main.*.js'])
        );

        // Enhanced Terser configuration for better minification
        webpackConfig.optimization.minimizer = [
          new TerserPlugin({
            terserOptions: {
              parse: {
                ecma: 8,
              },
              compress: {
                ecma: 5,
                warnings: false,
                comparisons: false,
                inline: 2,
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
              },
              mangle: {
                safari10: true,
                properties: {
                  regex: /^_/,
                },
              },
              output: {
                ecma: 5,
                comments: false, // Remove all comments including sourceMappingURL
                ascii_only: true,
              },
              sourceMap: false, // Explicitly disable source maps
            },
            extractComments: false,
          }),
        ];
      }

      return webpackConfig;
    },
  },
};

