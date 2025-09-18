import {
  createRestApiClient,
  currentLanguage,
  getInstanceId,
  isUserLoggedIn,
  load,
  Obj,
} from 'scrivito'
import { getTokenAuthorization } from './getTokenAuthorization'
import { jwtPisaSalesApiUrl } from './jwtPisaSalesApiConfig'

export async function pisaSalesApiUrl(): Promise<string | null> {
  if (import.meta.env.FORCE_LOCAL_STORAGE) return null

  if (!isUserLoggedIn()) return null

  const instanceConfig = (await createRestApiClient(
    'https://api.justrelate.com',
  ).get(`/ams/instances/${getInstanceId()}`)) as {
    pisa_sales_api_url?: string | null
  }

  return instanceConfig.pisa_sales_api_url || null
}

export async function pisaClient(subPath: string) {
  const config = await pisaConfig(subPath)
  if (!config) return null

  const { url, headers } = config

  return createRestApiClient(url, { headers })
}

export async function pisaConfig(subPath: string) {
  const baseUrl = await pisaSalesApiUrl()
  if (!baseUrl) return null

  return {
    url: `${baseUrl}/${subPath}`,
    headers: {
      'Accept-Language': await load(() => currentLanguage() ?? 'en'),
    },
  }
}

export async function questionnaireBackendConnection() {
  // workaround to wait until configure is done
  await load(() => Obj.onAllSites().all().count());
  const defaultUrl = await pisaSalesApiUrl()
  if (defaultUrl) {
    return { apiUrl: defaultUrl, token: null }
  }
  const jwt = await jwtPisaSalesApiUrl()
  return { apiUrl: jwt, token: getTokenAuthorization() }
}
