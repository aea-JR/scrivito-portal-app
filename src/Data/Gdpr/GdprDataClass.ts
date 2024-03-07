import { provideDataClass } from 'scrivito'

const apiPath = '../pisa-api/gdpr'

export const Gdpr = provideDataClass('Gdpr', {
  // @ts-expect-error until out of private beta
  apiPath,
})
