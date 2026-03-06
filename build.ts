const entrypoints = [
  "src/handlers/check-auth.ts",
  "src/handlers/generate-secret.ts",
  "src/handlers/http-headers.ts",
  "src/handlers/parse-auth.ts",
  "src/handlers/refresh-auth.ts",
  "src/handlers/sign-out.ts",
]

const result = await Bun.build({
  entrypoints,
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
})

if (!result.success) {
  console.error("Build failed:")
  for (const log of result.logs) {
    console.error(log)
  }
  process.exit(1)
}

// Check bundle sizes (Lambda@Edge limit: 1MB for viewer request)
const MAX_SIZE = 1048576
for (const output of result.outputs) {
  if (output.kind !== "entry-point") continue
  const size = output.size
  if (size > MAX_SIZE) {
    console.error(
      `Bundle too large: ${output.path} (${size} bytes, max ${MAX_SIZE})`,
    )
    process.exit(1)
  }
}

console.log(`Built ${result.outputs.filter((o) => o.kind === "entry-point").length} bundles`)
