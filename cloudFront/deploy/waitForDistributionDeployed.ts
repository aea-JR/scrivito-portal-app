import {
  CloudFrontClient,
  waitUntilDistributionDeployed,
} from "@aws-sdk/client-cloudfront";

/** Waits for "distributionDeployed" and prints out resulting status */
export async function waitForDistributionDeployed(
  cloudFrontClient: CloudFrontClient,
  distributionId: string,
): Promise<void> {
  console.log("⏳ Waiting for Deployment to finish... ⏳");

  await waitUntilDistributionDeployed(
    {
      client: cloudFrontClient,
      maxWaitTime: 900,
      maxDelay: 5,
      minDelay: 5,
    },
    {
      Id: distributionId,
    },
  );
  console.log("⌛ Deployment succeeded! ⌛");
}
