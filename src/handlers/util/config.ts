import { readFileSync } from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"
import { parse } from "cookie"
import type { HttpHeaders } from "./cloudfront"
import type { CookieSettings } from "./cookies"
import { Logger, LogLevel } from "./logger"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export interface StoredConfig {
  userPoolId: string
  clientId: string
  oauthScopes: string[]
  cognitoAuthDomain: string
  callbackPath: string
  signOutRedirectTo: string
  signOutPath: string
  refreshAuthPath: string
  cookieSettings: CookieSettings
  httpHeaders: HttpHeaders
  clientSecret: string
  nonceSigningSecret: string
  logLevel: keyof typeof LogLevel
  requireGroupAnyOf?: string[] | null
}

export interface Config extends StoredConfig {
  tokenIssuer: string
  tokenJwksUri: string
  logger: Logger
  nonceMaxAge: number
}

export function getConfig(): Config {
  const filename = "config.json"
  const dirname = process.env.LAMBDA_TASK_ROOT || __dirname
  const configFilePath = path.join(dirname, filename)
  console.log("Loading config from", configFilePath)
  const config = JSON.parse(
    readFileSync(configFilePath, "utf-8"),
  ) as StoredConfig

  // Derive the issuer and JWKS uri all JWT's will be signed with from
  // the User Pool's ID and region.
  // biome-ignore lint/style/noNonNullAssertion: Suppression carried over from eslint
  const userPoolRegion = /^(\S+?)_\S+$/.exec(config.userPoolId)![1]
  const tokenIssuer = `https://cognito-idp.${userPoolRegion}.amazonaws.com/${config.userPoolId}`
  const tokenJwksUri = `${tokenIssuer}/.well-known/jwks.json`

  return {
    nonceMaxAge:
      Number.parseInt(
        parse(config.cookieSettings.nonce.toLowerCase())["max-age"],
        10,
      ) || 60 * 60 * 24,
    ...config,
    tokenIssuer,
    tokenJwksUri,
    logger: new Logger(LogLevel[config.logLevel]),
  }
}
