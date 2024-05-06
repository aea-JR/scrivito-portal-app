import { Obj } from 'scrivito'

export function getCurrentLanguage(): undefined | string {
  const currentSiteLanguage = Obj.root()?.language()
  return currentSiteLanguage === null ? 'en' : currentSiteLanguage
}

export function languageHeaders() {
  return { 'Accept-Language': getCurrentLanguage() ?? 'en' }
}
