import {
  ListObjectsV2Command,
  HeadObjectCommand,
  HeadObjectCommandOutput,
} from "@aws-sdk/client-s3";
import { chunk, isString } from "lodash";
import { awsS3 } from "./awsS3";

export type HeadObject = HeadObjectCommandOutput & {
  Key: string;
};

export interface HeadObjects {
  [key: string]: HeadObject | undefined;
}

export function isHeadObject(
  headObject: HeadObject | undefined,
): headObject is HeadObject {
  return headObject !== undefined;
}

export async function listHeadObjects(bucket: string): Promise<HeadObjects> {
  let continuationToken: string | undefined;
  const keys: string[] = [];
  const results: HeadObjects = {};

  do {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      ContinuationToken: continuationToken,
    });

    const response = await awsS3.send(command);

    response.Contents?.forEach((item) => {
      if (isString(item.Key)) {
        keys.push(item.Key);
      }
    });

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  for (const chunkedKeys of chunk(keys, 100)) {
    await Promise.all(
      chunkedKeys.map(async (key) => {
        const headCommand = new HeadObjectCommand({
          Bucket: bucket,
          Key: key,
        });
        const response = (await awsS3.send(
          headCommand,
        )) as HeadObjectCommandOutput;
        results[key] = { ...response, Key: key };
      }),
    );
  }

  return results;
}
