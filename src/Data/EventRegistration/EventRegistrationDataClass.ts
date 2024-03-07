import { provideDataClass } from 'scrivito'

const apiPath = '../pisa-api/event-registration'

export const EventRegistration = provideDataClass('EventRegistration', {
  // @ts-expect-error until out of private beta
  apiPath,
})
