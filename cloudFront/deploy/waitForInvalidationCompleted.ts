import { CloudFront } from './aws'
import { waitUntilInvalidationCompleted } from '@aws-sdk/client-cloudfront'

export async function waitForInvalidationCompleted({
  cloudFrontDistributionId,
  invalidationId,
}: {
  cloudFrontDistributionId: string
  invalidationId: string
}): Promise<void> {
  console.log('⏳ Waiting for Invalidation to finish... ⏳')

  await waitUntilInvalidationCompleted(
    {
      client: CloudFront,
      maxWaitTime: 600, // Total max wait time in seconds (10 minutes)
      maxDelay: 30,
      minDelay: 5,
    },
    {
      DistributionId: cloudFrontDistributionId,
      Id: invalidationId,
    },
  )

  console.log('⌛ Invalidation finished! ⌛')
}
