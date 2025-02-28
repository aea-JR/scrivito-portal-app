import { deployLambdaFunction } from "./deployLambda";
import { ensureEnv } from "../utils";
import { invalidateCloudFront } from "./invalidateCloudFront";

async function init() {
  console.log("⏩ Starting deployment... ⏩");
  const accountId = ensureEnv("ACCOUNT_ID");
  const cloudFrontDistributionId = ensureEnv("CLOUD_FRONT_DISTRIBUTION_ID");
  const codeBuildId = process.env.CODEBUILD_BUILD_ID || "local-build";

  await deployLambdaFunction({
    cloudFrontDistributionId,
    accountId,
    lambdaName: ensureEnv("ORIGIN_RESPONSE_NAME"),
    eventType: "origin-response",
  });

  /**  await deployLambdaFunction({
    cloudFrontDistributionId,
    accountId,
    lambdaName: ensureEnv('ORIGIN_REQUEST_NAME'),
    eventType: 'origin-request',
  }) */

  await invalidateCloudFront({
    cloudFrontDistributionId,
    invalidationCallerReference: codeBuildId,
  });
}

init().catch((error) => {
  console.error("❌ An error occurred!", error);
  process.exitCode = 1;
});
