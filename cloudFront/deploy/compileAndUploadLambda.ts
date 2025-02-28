import { transformFileAsync } from "@babel/core";
import { updateLambda } from "./updateLambda";

/** Compiles sourceFileName, uploads it to Lambda und publishes a new Lambda version */
export async function compileAndUploadLambda(
  sourceFileName: string,
  functionArn: string,
): Promise<string | undefined> {
  console.log(`   Compiling and uploading ${sourceFileName}...`);
  const babelResult = await transformFileAsync(sourceFileName);
  if (!(babelResult && babelResult.code)) {
    throw new Error(`Babel could not compile ${sourceFileName}!`);
  }
  const lambdaVersionArn = await updateLambda(functionArn, babelResult.code);
  return lambdaVersionArn || undefined;
}
