import { PutObjectCommand } from "@aws-sdk/client-s3";
import { awsS3 } from "./awsS3";

export async function uploadToS3(params: {
  Bucket: string;
  Key: string;
  Body: Buffer | string;
  CacheControl?: string;
  ContentType?: string;
  ContentEncoding?: string;
  WebsiteRedirectLocation?: string;
}) {
  const command = new PutObjectCommand(params);

  return await awsS3.send(command);
}
