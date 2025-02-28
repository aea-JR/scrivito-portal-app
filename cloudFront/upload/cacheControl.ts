import { isAssetKey } from "./isAssetKey";

export function cacheControl(key: string): string {
  if (isAssetKey(key)) {
    return `public, max-age=${ONE_YEAR_IN_SECONDS}, s-maxage=${ONE_YEAR_IN_SECONDS}`;
  }

  return "public, max-age=0, s-maxage=120, must-revalidate";
}

const ONE_YEAR_IN_SECONDS = 31536000;
