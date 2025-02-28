import { S3 } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import https from "https";
import { ensureEnv } from "../utils";

/* NodeHttpHandler is used to customize HTTP request handling for the S3 client,
 *  it enables HTTP keep-alive, reducing latency and improving performance */

const keepAliveAgent = new https.Agent({ keepAlive: true });
export const awsS3 = new S3({
  maxAttempts: 10,
  region: ensureEnv("AWS_REGION"),
  requestHandler: new NodeHttpHandler({
    httpsAgent: keepAliveAgent,
  }),
});
