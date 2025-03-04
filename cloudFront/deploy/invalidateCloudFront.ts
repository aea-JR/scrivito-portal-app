import { CloudFront } from './aws'
import { assert } from '../utils'
import { CreateInvalidationCommand } from '@aws-sdk/client-cloudfront'
import { waitForInvalidationCompleted } from './waitForInvalidationCompleted'

/** Invalidations all files in the given CloudFront distribution */
export async function invalidateCloudFront({
  cloudFrontDistributionId,
  invalidationCallerReference,
}: {
  cloudFrontDistributionId: string
  invalidationCallerReference: string
}): Promise<void> {
  const pathsToInvalidate = ['/*']

  const command = new CreateInvalidationCommand({
    DistributionId: cloudFrontDistributionId,
    InvalidationBatch: {
      CallerReference: invalidationCallerReference,
      Paths: {
        Quantity: pathsToInvalidate.length,
        Items: pathsToInvalidate,
      },
    },
  })

  const { Invalidation } = await CloudFront.send(command)

  assert(
    Invalidation && Invalidation.Id,
    'Invalidation of createInvalidation is not set!',
  )

  await waitForInvalidationCompleted({
    cloudFrontDistributionId,
    invalidationId: Invalidation.Id,
  })
}
