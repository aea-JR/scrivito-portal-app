import { provideDataClass, unstable_JrRestApi } from 'scrivito'

const apiPath = '../pisa-api/gdpr'

export const Gdpr = provideDataClass('Gdpr', {
  connection: {
    index: async (params) =>
      unstable_JrRestApi.fetch(apiPath, {
        params: {
          ...params.filters(),
          _continuation: params.continuation(),
          _order: params.order().length
            ? params
                .order()
                .map((o) => o.join('.'))
                .join(',')
            : undefined,
          _limit: params.limit().toString(),
          _search: params.search() || undefined,
        },
      }) as Promise<{ results: Array<{ _id: string }>; continuation?: string }>,

    get: async (id) => {
      const response = await unstable_JrRestApi.fetch(`${apiPath}/${id}`)
      return response
    },

    update: async (id, data) => {
      const response = await unstable_JrRestApi.fetch(`${apiPath}/${id}`, {
        method: 'put',
        data,
      })
      return response
    },
  },
})
