import { chunk } from 'lodash'
import { awsS3 } from './awsS3'
import { createProgressBar } from './createProgressBar'
import { HeadObject } from './listHeadObjects'
import { REMOVE_AFTER_DATE_KEY } from './removalDate'

const ONE_DAY_IN_MS = 86_400_000

export async function markForRemoval(
  bucket: string,
  toBeMarked: HeadObject[],
): Promise<void> {
  if (!toBeMarked.length) return

  const markedForRemovalMetadata = {
    [REMOVE_AFTER_DATE_KEY]: `${Date.now() + ONE_DAY_IN_MS}`,
  }

  const progressBar = createProgressBar(
    'files marked obsolete',
    toBeMarked.length,
  )
  try {
    for (const chunkedToBeMarked of chunk(toBeMarked, 100)) {
      await Promise.all(
        chunkedToBeMarked.map((headObject) =>
          extendMetadataWith(bucket, headObject, markedForRemovalMetadata),
        ),
      )
      progressBar.increment(chunkedToBeMarked.length, { currentItem: '' })
    }
  } finally {
    progressBar.stop()
  }
}

async function extendMetadataWith(
  bucket: string,
  headObject: HeadObject,
  additionalMetadata: { [key: string]: string },
) {
  const key = headObject.Key

  await awsS3.copyObject({
    Bucket: bucket,
    Key: key,
    CopySource: `${bucket}/${key}`,
    CopySourceIfMatch: headObject.ETag,
    CopySourceIfUnmodifiedSince: headObject.LastModified,
    MetadataDirective: 'REPLACE',
    Metadata: { ...headObject.Metadata, ...additionalMetadata },
    CacheControl: headObject.CacheControl,
    ContentDisposition: headObject.ContentDisposition,
    ContentEncoding: headObject.ContentEncoding,
    ContentLanguage: headObject.ContentLanguage,
    ContentType: headObject.ContentType,
  })
}
