import { Lambda } from "./aws";
import { bufferToSha256 } from "./bufferToSha256";
import { createZipFile } from "./createZipFile";
import { assert } from "../utils";
import {
  UpdateFunctionCodeCommand,
  GetFunctionCommand,
} from "@aws-sdk/client-lambda";
import { waitForLambdaVersionToBeActive } from "./waitForLambdaVersionToBeActive";

/**
 * Updates the lambda function with the given code and
 * returns a newly published version ARN or undefined if no update is needed.
 */
export async function updateLambda(
  functionArn: string,
  code: string,
): Promise<string | undefined> {
  const ZipFile = await createZipFile(code);
  const newCodeSha256 = bufferToSha256(ZipFile);

  const getFunctionCommand = new GetFunctionCommand({
    FunctionName: functionArn,
  });
  const currentFunction = await Lambda.send(getFunctionCommand);

  const currentCodeSha256 = currentFunction.Configuration?.CodeSha256;

  console.log(`   Current Lambda code SHA256: ${currentCodeSha256}`);
  console.log(`   New Lambda code SHA256: ${newCodeSha256}`);

  if (currentCodeSha256 === newCodeSha256) {
    console.log(
      `Lambda function ${functionArn} code doesn't have changes. Skipping update.`,
    );
    return undefined;
  }

  console.log(`⏳ Updating ${functionArn}... ⏳`);

  const updateFunctionCodeCommand = new UpdateFunctionCodeCommand({
    FunctionName: functionArn,
    Publish: true,
    ZipFile,
  });

  const updatedConfiguration = await Lambda.send(updateFunctionCodeCommand);
  const versionArn = updatedConfiguration.FunctionArn;
  assert(versionArn, "❌ FunctionArn of updated lambda function is missing!");

  await waitForLambdaVersionToBeActive({
    functionName: versionArn,
  });

  console.log(` New function version ARN: ${versionArn} `);

  return versionArn;
}
