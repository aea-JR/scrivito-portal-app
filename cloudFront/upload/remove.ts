import { DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { awsS3 } from "./awsS3";
import { chunk } from "lodash";

const DELETE_CHUNK_SIZE = 1_000;

export async function remove(bucket: string, keys: string[]): Promise<void> {
  if (!keys.length) {
    return;
  }

  for (const chunkedKeys of chunk(keys, DELETE_CHUNK_SIZE)) {
    const Objects = chunkedKeys.map((key) => ({ Key: key }));
    const params = {
      Bucket: bucket,
      Delete: { Objects },
    };

    const data = await awsS3.send(new DeleteObjectsCommand(params));
  }
}
