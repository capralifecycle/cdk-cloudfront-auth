import { createResponseHandler } from "./util/cloudfront"

// Headers are added in the response handler.
export const handler = createResponseHandler(
  // biome-ignore lint/correctness/noUnusedFunctionParameters: suppression carried over from eslint
  async (config, event) => event.Records[0].cf.response,
)
