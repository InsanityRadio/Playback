var debug = process.env.NODE_ENV !== "production";
var webpack = require('webpack');

module.exports = {
	context: __dirname,
	devtool: debug ? "inline-sourcemap" : false,
	module: {
		rules: [
			{
				test: /\.css$/,
				use: 'raw-loader'
			}
		]
	},
	mode: debug ? 'development' : 'production'
};
