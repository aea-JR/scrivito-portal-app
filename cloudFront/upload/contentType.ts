import path from "path";
import mime from "mime-types";

export function contentType(filePath: string): string | undefined {
  const extension = path.extname(filePath);
  return mime.contentType(extension) || undefined;
}
