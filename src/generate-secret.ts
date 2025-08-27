import * as path from "node:path"
import { fileURLToPath } from "node:url"
import { CustomResource, Stack } from "aws-cdk-lib"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as cr from "aws-cdk-lib/custom-resources"
import { Construct } from "constructs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface GenerateSecretProps {
  /**
   * Nonce to force secret update.
   */
  nonce?: string
}

/**
 * Generate a secret to be used in other parts of the deployment.
 */
export class GenerateSecret extends Construct {
  public readonly value: string

  constructor(scope: Construct, id: string, props?: GenerateSecretProps) {
    super(scope, id)

    const resource = new CustomResource(this, "Resource", {
      serviceToken: GenerateSecretProvider.getOrCreate(this).serviceToken,
      properties: {
        Nonce: props?.nonce ?? "",
      },
    })

    this.value = resource.getAttString("Value")
  }
}

class GenerateSecretProvider extends Construct {
  /**
   * Returns the singleton provider.
   */
  public static getOrCreate(scope: Construct) {
    const stack = Stack.of(scope)
    const id = "liflig-infra.cloudfront-auth.generate-secret.provider"
    return (
      (stack.node.tryFindChild(id) as GenerateSecretProvider) ||
      new GenerateSecretProvider(stack, id)
    )
  }

  private readonly provider: cr.Provider
  public readonly serviceToken: string

  constructor(scope: Construct, id: string) {
    super(scope, id)

    this.provider = new cr.Provider(this, "Provider", {
      onEventHandler: new lambda.Function(this, "Function", {
        code: lambda.Code.fromAsset(
          path.join(__dirname, "../dist/generate-secret"),
        ),
        handler: "index.handler",
        runtime: lambda.Runtime.NODEJS_22_X,
      }),
    })

    this.serviceToken = this.provider.serviceToken
  }
}
