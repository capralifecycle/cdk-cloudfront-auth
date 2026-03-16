import { CfnParameter, Stack } from "aws-cdk-lib"
import * as ssm from "aws-cdk-lib/aws-ssm"
import * as cr from "aws-cdk-lib/custom-resources"
import { Construct } from "constructs"

export interface CrossRegionParamProps<T> {
  /**
   * Nonce to force the stack to re-check for updated values.
   *
   * @default Date.now().toString()
   */
  nonce?: string
  /**
   * SSM Parameter name used to store the reference.
   */
  parameterName: string
  /**
   * The resource to make available cross-region.
   */
  resource: T
  /**
   * Convert the resource to a string representation for storage in SSM.
   */
  resourceToReference(resource: T): string
  /**
   * Reconstruct the resource from its stored string representation.
   */
  referenceToResource(scope: Construct, id: string, reference: string): T
  /**
   * Regions where this reference should be available.
   */
  regions: string[]
}

/**
 * Makes a CDK resource available in other AWS regions by storing a
 * string reference in SSM Parameter Store.
 *
 * On the producer side (constructor), the resource's string representation
 * is written to SSM in each target region via custom resources.
 *
 * On the consumer side (get), the reference is read back from SSM and
 * used to reconstruct the resource. If producer and consumer are in the
 * same region, the resource is returned directly without SSM.
 */
export class CrossRegionParam<T> extends Construct {
  private readonly nonce: string
  private readonly parameterName: string
  private readonly resource: T
  private readonly referenceToResource: CrossRegionParamProps<T>["referenceToResource"]
  private readonly regions: string[]

  constructor(scope: Construct, id: string, props: CrossRegionParamProps<T>) {
    super(scope, id)
    this.nonce = props.nonce ?? Date.now().toString()
    this.parameterName = props.parameterName
    this.resource = props.resource
    this.referenceToResource = props.referenceToResource
    this.regions = props.regions

    const value = props.resourceToReference(props.resource)

    for (const region of props.regions) {
      this.putParameterInRegion(`Param${region}`, {
        name: this.parameterName,
        region,
        value,
      })
    }
  }

  /**
   * Retrieve the resource. Returns it directly when in the same region
   * as the producer, otherwise resolves it from SSM Parameter Store.
   */
  public get(scope: Construct, id: string): T {
    const producerRegion = Stack.of(this).region
    const consumerRegion = Stack.of(scope).region

    if (producerRegion === consumerRegion) {
      return this.resource
    }

    if (!this.regions.includes(consumerRegion)) {
      throw new Error(
        `Region ${consumerRegion} is not registered for parameter ${this.parameterName}`,
      )
    }

    scope.node.addDependency(this)

    new CfnParameter(scope, `${id}Nonce`, {
      default: this.nonce,
    })

    const reference = ssm.StringParameter.valueForStringParameter(
      scope,
      this.parameterName,
    )
    return this.referenceToResource(scope, id, reference)
  }

  /**
   * Write an SSM Parameter to a specific region using a custom resource.
   */
  private putParameterInRegion(
    id: string,
    props: { name: string; region: string; value: string },
  ) {
    const physicalResourceId = cr.PhysicalResourceId.of(props.name)

    new cr.AwsCustomResource(this, id, {
      onUpdate: {
        service: "SSM",
        action: "putParameter",
        parameters: {
          Name: props.name,
          Value: props.value,
          Type: "String",
          Overwrite: true,
        },
        region: props.region,
        physicalResourceId,
      },
      onDelete: {
        service: "SSM",
        action: "deleteParameter",
        parameters: {
          Name: props.name,
        },
        region: props.region,
        physicalResourceId,
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
      installLatestAwsSdk: false,
    })
  }
}
