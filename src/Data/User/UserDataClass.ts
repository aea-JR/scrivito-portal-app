import { CurrentUser } from '../CurrentUser/CurrentUserDataItem'
import { load, provideDataClass, unstable_JrRestApi } from 'scrivito'

const apiPath = '../pisa-api/user'

// TODO: use `provideDataClass('User', { apiPath })` once available (with 1.39.0?)
export const User = provideDataClass('User', {
  connection: {
    index: async (params) => {
      const { results, continuation } = await (unstable_JrRestApi.fetch(
        apiPath,
        {
          params: {
            ...params.filters(),
            _continuation: params.continuation(),
            _order: params.order().length
              ? params
                  .order()
                  .map((o) => o.join('.'))
                  .join(',')
              : undefined,
            _search: params.search() || undefined,
          },
        },
      ) as Promise<{ results: Array<{ _id: string }>; continuation?: string }>)

      return {
        results: await Promise.all(results.map(postProcessData)),
        continuation,
      }
    },
    get: async (id) => {
      const item = await unstable_JrRestApi.fetch(`${apiPath}/${id}`)
      return item ? postProcessData(item as { _id: string }) : item
    },
  },
})

async function postProcessData(data: { _id: string }) {
  // Use the data item cached by Scrivito instead of connecting to the backend directly
  const pisaUserId = await load(() => CurrentUser.get('pisaUserId'))
  if (data._id !== pisaUserId) return data

  return {
    _id: data._id,
    staff: false,
    email: await load(() => CurrentUser.get('email')),
    familyName: await load(() => CurrentUser.get('familyName')),
    givenName: await load(() => CurrentUser.get('givenName')),
    image: { url: await load(() => CurrentUser.get('picture')) },
    name: await load(() => CurrentUser.get('name')),
    salutation: await load(() => CurrentUser.get('salutation')),
  }
}

interface UserData {
  name: string
  givenName: string
  familyName: string
  salutation: string
}

export function isUserData(input: unknown): input is UserData {
  return (
    !!input &&
    typeof input === 'object' &&
    typeof (input as UserData).name === 'string' &&
    typeof (input as UserData).givenName === 'string' &&
    typeof (input as UserData).familyName === 'string' &&
    typeof (input as UserData).salutation === 'string'
  )
}
