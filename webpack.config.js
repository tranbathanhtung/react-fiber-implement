var path = require('path');
// var ExtractTextPlugin = require('extract-text-webpack-plugin');
var ReplacePlugin = require('replace-bundle-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');


module.exports = {
	entry: {
    bundle: './index.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
	},
	module: {
		rules: [
			{
				test: /\.jsx?$/,
				exclude: /node_modules/,
				loader: 'babel-loader'
			},
			{
      	test: /\.js$/,
     		exclude: /node_modules/,
     		use: 'babel-loader'
   		},
			// {
			// 	test: /\.css$/,
			// 	loader: ExtractTextPlugin.extract('style')
			// }
		]
	},
	plugins: [
   new HtmlWebpackPlugin({
		 template: 'index.html'
	 })
	],
	devtool: 'source-map',
	devServer: {
		port: process.env.PORT || 8080
	}
};
