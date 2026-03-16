const [handlerResult, lambdaConfigResult] = await Promise.all([
  Bun.build({
    entrypoints: [
      "src/handlers/check-auth.ts",
      "src/handlers/generate-secret.ts",
      "src/handlers/http-headers.ts",
      "src/handlers/parse-auth.ts",
      "src/handlers/refresh-auth.ts",
      "src/handlers/sign-out.ts",
    ],
    outdir: "dist",
    target: "node",
    format: "cjs",
    minify: true,
    naming: {
      entry: "[dir]/[name]/index.js",
    },
    loader: {
      ".html": "text",
    },
  }),
  // Lambda-config custom resource handler (not Lambda@Edge, no size limit)
  Bun.build({
    entrypoints: ["src/lambda-config/handler.ts"],
    outdir: "dist/lambda-config-handler",
    target: "node",
    format: "cjs",
    minify: true,
    naming: {
      entry: "index.js",
    },
    external: ["@aws-sdk/*"],
  }),
])

function assertBuildSuccess(
  result: Awaited<ReturnType<typeof Bun.build>>,
  label: string,
) {
  if (!result.success) {
    console.error(`${label} build failed:`)
    for (const log of result.logs) {
      console.error(log)
    }
    process.exit(1)
  }
}

assertBuildSuccess(handlerResult, "Handler")
assertBuildSuccess(lambdaConfigResult, "Lambda config handler")

// Check bundle sizes (Lambda@Edge limit: 1MB for viewer request)
const MAX_SIZE = 1048576
for (const output of handlerResult.outputs) {
  if (output.kind !== "entry-point") continue
  const size = output.size
  if (size > MAX_SIZE) {
    console.error(
      `Bundle too large: ${output.path} (${size} bytes, max ${MAX_SIZE})`,
    )
    process.exit(1)
  }
}

const totalBuilt =
  handlerResult.outputs.filter((o) => o.kind === "entry-point").length +
  lambdaConfigResult.outputs.filter((o) => o.kind === "entry-point").length
console.log(`Built ${totalBuilt} bundles`)
