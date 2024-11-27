// Override values in CDK stacks during tests.
process.env.IS_SNAPSHOT = "true"

export default {
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  moduleNameMapper: {
    "\\.html$": "<rootDir>/file-mock.cjs",
  },
}
