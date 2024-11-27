// Override values in CDK stacks during tests.
process.env.IS_SNAPSHOT = "true"

export default {
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        module: "es2022",
      },
    ],
  },
  moduleNameMapper: {
    "\\.html$": "<rootDir>/file-mock.cjs",
  },
  extensionsToTreatAsEsm: [".ts"],
  testEnvironment: "node",
}
