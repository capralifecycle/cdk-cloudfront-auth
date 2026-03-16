import { App, Stack } from "aws-cdk-lib"
import { Template } from "aws-cdk-lib/assertions"
import { CrossRegionParam } from "./cross-region-params"

function createParam(props: {
  producerRegion: string
  consumerRegion?: string
  regions: string[]
  nonce?: string
}) {
  const app = new App()
  const producerStack = new Stack(app, "ProducerStack", {
    env: { account: "112233445566", region: props.producerRegion },
  })

  const param = new CrossRegionParam<string>(producerStack, "Param", {
    parameterName: "/test/my-param",
    resource: "my-resource-value",
    resourceToReference: (r) => r,
    referenceToResource: (_scope, _id, ref) => ref,
    regions: props.regions,
    nonce: props.nonce,
  })

  if (!props.consumerRegion) {
    return { app, producerStack, param }
  }

  const consumerStack = new Stack(app, "ConsumerStack", {
    env: { account: "112233445566", region: props.consumerRegion },
  })
  const resolved = param.get(consumerStack, "Import")

  return { app, producerStack, consumerStack, param, resolved }
}

test("creates SSM parameters in each target region", () => {
  const { producerStack } = createParam({
    producerRegion: "us-east-1",
    regions: ["eu-west-1", "ap-southeast-1"],
  })

  const template = Template.fromStack(producerStack)

  // Should have two custom resources for the two target regions
  template.resourceCountIs("Custom::AWS", 2)
})

test("get returns resource directly when same region", () => {
  const { resolved } = createParam({
    producerRegion: "us-east-1",
    consumerRegion: "us-east-1",
    regions: ["us-east-1"],
  })

  // Same region: returns the original string directly
  expect(resolved).toBe("my-resource-value")
})

test("get resolves via SSM when cross-region", () => {
  const { consumerStack } = createParam({
    producerRegion: "us-east-1",
    consumerRegion: "eu-west-1",
    regions: ["eu-west-1"],
    nonce: "test-nonce",
  })

  const template = Template.fromStack(consumerStack)

  // Consumer stack should have a CfnParameter for the nonce
  template.hasParameter("ImportNonce", {
    Default: "test-nonce",
  })
})

test("get throws for unregistered region", () => {
  expect(() =>
    createParam({
      producerRegion: "us-east-1",
      consumerRegion: "ap-southeast-1",
      regions: ["eu-west-1"],
    }),
  ).toThrow("Region ap-southeast-1 is not registered")
})
