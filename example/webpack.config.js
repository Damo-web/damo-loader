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
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'damo-loader'
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