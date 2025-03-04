import { CloudFront } from './aws'
import {
  GetDistributionCommand,
  UpdateDistributionCommand,
  DistributionConfig,
  LambdaFunctionAssociations,
} from '@aws-sdk/client-cloudfront'
import { assert } from '../utils'

/**
 * Updates CloudFront with given lambda function version ARN.
 * Returns true if CloudFront association was modified.
 */
export async function updateCloudFront({
  cloudFrontDistributionId,
  lambdaFunctionArn,
  lambdaFunctionVersionArn,
  eventType,
}: {
  cloudFrontDistributionId: string
  lambdaFunctionArn: string
  lambdaFunctionVersionArn: string
  eventType: 'origin-request' | 'origin-response'
}): Promise<boolean> {
  const { Distribution, ETag } = await CloudFront.send(
    new GetDistributionCommand({ Id: cloudFrontDistributionId }),
  )
  assert(Distribution && ETag, 'Distribution or ETag not set!')

  assert(
    Distribution.DistributionConfig,
    'Distribution of getDistribution is not set!',
  )
  const distributionConfig: DistributionConfig = Distribution.DistributionConfig

  assert(
    distributionConfig.DefaultCacheBehavior,
    'DefaultCacheBehavior is not set!',
  )
  const defaultCacheBehavior = distributionConfig.DefaultCacheBehavior

  assert(
    defaultCacheBehavior.LambdaFunctionAssociations,
    'LambdaFunctionAssociations is not set!',
  )
  const lambdaFunctionAssociations: LambdaFunctionAssociations =
    defaultCacheBehavior.LambdaFunctionAssociations

  assert(
    lambdaFunctionAssociations.Items,
    'LambdaFunctionAssociations.Items is not set!',
  )
  const lambdaAssociation = lambdaFunctionAssociations.Items.find(
    (assoc) =>
      assoc.EventType === eventType &&
      assoc.LambdaFunctionARN?.startsWith(lambdaFunctionArn),
  )

  assert(
    lambdaAssociation,
    `No existing ${eventType} association found to update.`,
  )

  lambdaAssociation.LambdaFunctionARN = lambdaFunctionVersionArn

  await CloudFront.send(
    new UpdateDistributionCommand({
      Id: cloudFrontDistributionId,
      DistributionConfig: distributionConfig,
      IfMatch: ETag,
    }),
  )

  console.log(`CloudFront distribution updated successfully for ${eventType}.`)
  return true
}
