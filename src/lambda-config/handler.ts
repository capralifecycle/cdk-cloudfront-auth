import { mkdtempSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import {
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
  LambdaClient,
  UpdateFunctionCodeCommand,
} from "@aws-sdk/client-lambda"
import Zip from "adm-zip"
import axios from "axios"

type OnEventHandler = (event: {
  RequestType: "Create" | "Update" | "Delete"
  PhysicalResourceId?: string
  ResourceProperties: Record<string, unknown>
}) => Promise<{
  PhysicalResourceId?: string
  Data?: Record<string, unknown>
}>

type Config = Record<string, unknown>

export const handler: OnEventHandler = async (event) => {
  switch (event.RequestType) {
    case "Delete":
      return {
        PhysicalResourceId: event.PhysicalResourceId,
      }

    case "Create":
    case "Update": {
      console.log(JSON.stringify(event))

      const functionArnFull = event.ResourceProperties.FunctionArn as string
      const config = event.ResourceProperties.Config as Config

      const functionArn = withoutVersion(functionArnFull)
      console.log(`Modifying function '${functionArnFull}'`)

      const lambdaClient = new LambdaClient({
        region: getFunctionRegion(functionArn),
      })

      const { Code } = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: functionArn,
        }),
      )
      const { data } = await axios.get<Buffer>(Code?.Location ?? "", {
        responseType: "arraybuffer",
      })

      const { CodeSha256, Version, FunctionArn } = await lambdaClient.send(
        new UpdateFunctionCodeCommand({
          FunctionName: functionArn,
          ZipFile: addConfigToZip(data, config),
          Publish: true,
        }),
      )

      let attempts = 0
      while (++attempts <= 30) {
        const { State } = await lambdaClient.send(
          new GetFunctionConfigurationCommand({
            FunctionName: FunctionArn,
          }),
        )

        if (!State || State === "Pending") {
          console.log(
            `Waiting for updated Lambda function to become Active, is: ${State} (attempts: ${attempts})`,
          )
          await new Promise((resolve) =>
            setTimeout(resolve, Math.min(5000, 1000 * attempts)),
          )
          continue
        }
        if (State === "Active") {
          console.log("Function is now Active!")
          break
        }
        throw new Error(`Lambda function state is: ${State}`)
      }

      console.log("Updated function", { CodeSha256, Version, FunctionArn })

      return {
        PhysicalResourceId: functionArn,
        Data: { CodeSha256, Version, FunctionArn },
      }
    }
  }
}

function getFunctionRegion(arn: string): string {
  const match = /^arn:aws:lambda:([^:]+):/.exec(arn)
  if (!match) {
    throw new Error(`Could not extract region from '${arn}'`)
  }
  return match[1]
}

function withoutVersion(arn: string): string {
  const match = /^(arn:aws:lambda:[^:]+:[^:]+:function:[^:]+):[^:]+$/.exec(arn)
  if (!match) {
    return arn
  }
  return match[1]
}

function addConfigToZip(data: Buffer, config: Config): Buffer {
  const lambdaZip = new Zip(data)
  const tempDir = mkdtempSync("/tmp/lambda-package")
  lambdaZip.extractAllTo(tempDir, true)
  writeFileSync(
    resolve(tempDir, "config.json"),
    Buffer.from(JSON.stringify(config, null, 2)),
  )

  const newLambdaZip = new Zip()
  newLambdaZip.addLocalFolder(tempDir)
  return newLambdaZip.toBuffer()
}
