import crypto from 'crypto'
import { FileUpload } from './index'
import { containsRemovalDate } from './removalDate'
import { HeadObject } from './listHeadObjects'

export async function isFileModified(
  file: FileUpload,
  body: Buffer | string,
  headObject: HeadObject | undefined,
): Promise<boolean> {
  if (
    !headObject ||
    headObject.ContentType !== file.contentType ||
    headObject.CacheControl !== file.cacheControl ||
    containsRemovalDate(headObject)
  ) {
    return true
  }
  const identical = await isETagIdentical(body, headObject.ETag)
  return !identical
}

/**
 * This is the most simple implementation (simply using a md5 hash).
 * This will _not_ match if the existing S3 object was uploaded in chunks.
 * For more details and options see:
 * * https://teppen.io/2018/06/23/aws_s3_etags/
 * * https://github.com/andrewrk/node-s3-client/blob/master/lib/multipart_etag.js
 * * https://stackoverflow.com/q/12186993/881759
 * * https://www.npmjs.com/package/etag-hash aka https://github.com/pyramation/etag-hash
 */
async function isETagIdentical(
  body: Buffer | string,
  existingETag: string | undefined,
): Promise<boolean> {
  const localETag = `"${md5(body)}"`
  return localETag === existingETag
}

function md5(data: Buffer | string): string {
  return crypto.createHash('md5').update(data).digest('hex')
}
