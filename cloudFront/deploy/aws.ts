import { fromIni } from "@aws-sdk/credential-providers";
import { CloudFrontClient } from "@aws-sdk/client-cloudfront";
import { LambdaClient } from "@aws-sdk/client-lambda";
import { ensureEnv } from "../utils";

function getAwsCredentials() {
  if (!process.env.CODEBUILD_BUILD_ID) {
    const profile = ensureEnv("AWS_PROFILE");
    return fromIni({ profile });
  }
}

export const lambdaAtEdgeRegion = "us-east-1";
const cloudFrontRegion = ensureEnv("AWS_REGION");

export const CloudFront = new CloudFrontClient({
  credentials: getAwsCredentials(),
  region: cloudFrontRegion,
});

export const Lambda = new LambdaClient({
  credentials: getAwsCredentials(),
  region: lambdaAtEdgeRegion,
});
