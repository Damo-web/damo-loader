const path = require('path')
const DamoLoaderPlugin = require('../lib/plugin')


module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, './main.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/dist/'
  },
  devServer: {
    stats: "minimal",
    contentBase: __dirname
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'damo-loader',
      },
      // example configuring CSS Modules
      {
        test: /\.css$/,
        oneOf: [
          // this applies to <style module>
          {
            resourceQuery: /module/,
            use: [
              'vue-style-loader',
              {
                loader: 'css-loader',
                options: {
                  modules: true,
                  localIdentName: '[local]_[hash:base64:8]'
                }
              }
            ]
          },
          // this applies to <style> or <style scoped>
          {
            use: [
              'vue-style-loader',
              'css-loader'
            ]
          }
        ]
      }
    ]
  },
  resolveLoader: {
    alias: {
      'damo-loader': require.resolve('../lib')
    }
  },
  plugins: [
    new DamoLoaderPlugin()
  ]
}