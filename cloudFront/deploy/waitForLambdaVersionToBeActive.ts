import { Lambda } from "./aws";
import { GetFunctionConfigurationCommand } from "@aws-sdk/client-lambda";

export async function waitForLambdaVersionToBeActive({
  functionName,
}: {
  functionName: string;
}): Promise<void> {
  const maxRetries = 10;
  const delay = 10;
  console.log(
    `⏳ Waiting for Lambda function version ${functionName} to become active... ⏳`,
  );
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const command = new GetFunctionConfigurationCommand({
      FunctionName: functionName,
    });
    const configuration = await Lambda.send(command);
    if (configuration.State === "Active") {
      console.log(`ℹ️ Published version ${functionName} is now active`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, delay * 1000));
  }
  throw new Error(
    `❌ Lambda function ${functionName} did not become active within the expected time`,
  );
}
