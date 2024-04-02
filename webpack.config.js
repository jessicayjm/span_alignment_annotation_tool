const path = require("path");

module.exports = {
  mode: "development",
  entry: "./compAnn/js/main.jsx",
  output: {
    path: path.join(__dirname, "/compAnn/static/js/"),
    filename: "bundle.js",
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        // Test for js or jsx files
        test: /\.jsx?$/,
        // Exclude external modules from loader tests
        exclude: /node_modules/,
        loader: "babel-loader",
        options: {
          presets: ["@babel/preset-env", "@babel/preset-react"],
          plugins: ["@babel/transform-runtime"],
        },
      },
      {
        test: /\.css$/,
        use: [
            { loader: 'css-loader' }
        ]
      }
    ],
  },
  resolve: {
    extensions: [".js", ".jsx"],
  },
};
