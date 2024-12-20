import * as path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default {
  mode: "production",
  target: "node",
  node: {
    __dirname: false,
  },
  entry: {
    "check-auth/index": "./src/handlers/check-auth.ts",
    "generate-secret/index": "./src/handlers/generate-secret.ts",
    "http-headers/index": "./src/handlers/http-headers.ts",
    "parse-auth/index": "./src/handlers/parse-auth.ts",
    "refresh-auth/index": "./src/handlers/refresh-auth.ts",
    "sign-out/index": "./src/handlers/sign-out.ts",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.html$/,
        loader: "html-loader",
        options: {
          minimize: true,
        },
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    libraryTarget: "commonjs",
  },
  performance: {
    hints: "error",

    // Max size of deployment bundle in Lambda@Edge Viewer Request
    maxAssetSize: 1048576,

    // Max size of deployment bundle in Lambda@Edge Viewer Request
    maxEntrypointSize: 1048576,
  },
}
