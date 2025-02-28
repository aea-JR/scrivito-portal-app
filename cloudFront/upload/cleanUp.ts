import { isAssetKey } from "./isAssetKey";
import { remove } from "./remove";
import { markForRemoval } from "./markForRemoval";
import { containsRemovalDate, isRemovalDateReached } from "./removalDate";
import { HeadObject } from "./listHeadObjects";

export async function cleanUp(
  bucket: string,
  uploadedKeys: Set<string>,
  headObjectArray: HeadObject[],
): Promise<void> {
  const obsoleteObjects = headObjectArray.filter(
    (headObject) => !uploadedKeys.has(headObject.Key),
  );

  await removeObsoleteFiles(bucket, obsoleteObjects);
  await markObsoleteAssets(bucket, obsoleteObjects);
  await removeObsoleteAssets(bucket, obsoleteObjects);
}

async function removeObsoleteFiles(
  bucket: string,
  obsoleteObjects: HeadObject[],
) {
  const nonAssetKeys = obsoleteObjects
    .map(({ Key }) => Key)
    .filter((key) => !isAssetKey(key));
  await remove(bucket, nonAssetKeys);
  console.log(`♻ Removed ${nonAssetKeys.length} obsolete files from S3 ♻`);
}

async function markObsoleteAssets(
  bucket: string,
  obsoleteObjects: HeadObject[],
) {
  const assets = obsoleteObjects.filter(({ Key }) => isAssetKey(Key));
  const toBeMarked = assets.filter((asset) => !containsRemovalDate(asset));
  await markForRemoval(bucket, toBeMarked);
  console.log(`♻ Marked ${toBeMarked.length} files on S3 as obsolete ♻`);
}

async function removeObsoleteAssets(
  bucket: string,
  obsoleteObjects: HeadObject[],
) {
  const obsoleteAssetKeys = obsoleteObjects
    .filter(isRemovalDateReached)
    .map(({ Key }) => Key);

  await remove(bucket, obsoleteAssetKeys);
  console.log(
    `♻ Removed ${obsoleteAssetKeys.length} obsolete asset files from S3 ♻`,
  );
}
