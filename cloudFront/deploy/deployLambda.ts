import { compileAndUploadLambda } from "./compileAndUploadLambda";
import { updateCloudFront } from "./updateCloudFront";
import { waitForDistributionDeployed } from "./waitForDistributionDeployed";
import { CloudFront, lambdaAtEdgeRegion } from "./aws";
import { ensureEnv } from "../utils";

function getSourceFile(lambdaName: string): string {
  switch (lambdaName) {
    case ensureEnv("ORIGIN_RESPONSE_NAME"):
      return "src/originResponse.ts";
    case ensureEnv("ORIGIN_REQUEST_NAME"):
      return "src/originRequest.ts";
    default:
      throw new Error(
        `❌ No source file mapped for lambda function: ${lambdaName}`,
      );
  }
}

export async function deployLambdaFunction({
  cloudFrontDistributionId,
  accountId,
  lambdaName,
  eventType,
}: {
  cloudFrontDistributionId: string;
  accountId: string;
  lambdaName: string;
  eventType: "origin-request" | "origin-response";
}): Promise<void> {
  const lambdaArn = `arn:aws:lambda:${lambdaAtEdgeRegion}:${accountId}:function:${lambdaName}`;
  const sourceFileName = getSourceFile(lambdaName);

  const lambdaVersionArn = await compileAndUploadLambda(
    sourceFileName,
    lambdaArn,
  );

  if (!lambdaVersionArn) {
    console.log(
      `ℹ️ Skipping CloudFront update as the Lambda function ${lambdaName} has not changed.`,
    );
    return;
  }

  const isModified = await updateCloudFront({
    cloudFrontDistributionId,
    lambdaFunctionArn: lambdaArn,
    lambdaFunctionVersionArn: lambdaVersionArn,
    eventType,
  });

  if (isModified) {
    await waitForDistributionDeployed(CloudFront, cloudFrontDistributionId);
    console.log(`ℹ️ CloudFront distribution for ${eventType} updated.`);
  }
}
