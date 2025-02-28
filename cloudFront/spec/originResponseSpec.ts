import LambdaTester from 'lambda-tester'
import nock from 'nock'
import { handler } from '../src/originResponse'

describe('originResponse', () => {
  const PAGE_ID = '1234567890abcdef'

  it('keeps the original response', () => {
    return LambdaTester(handler)
      .event(buildOriginResponseEvent())
      .expectResolve((result: AWSLambda.CloudFrontResponse) => {
        expect(result.status).toEqual('200')
        expect(result.statusDescription).toEqual('OK')
        expect(result.headers.server).toEqual([
          { key: 'Server', value: 'MyCustomOrigin' },
        ])
        expect(result.headers['set-cookie']).toEqual([
          { key: 'Set-Cookie', value: 'theme=light' },
        ])
      })
  })

  itAddsHeader('X-Frame-Options', 'sameorigin')
  itAddsHeader('X-XSS-Protection', '1; mode=block')
  itAddsHeader('X-Content-Type-Options', 'nosniff')
  itAddsHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  itAddsHeader(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload',
  )

  it('adds header Content-Security-Policy', () => {
    return LambdaTester(handler)
      .event(buildOriginResponseEvent())
      .expectResolve((result: AWSLambda.CloudFrontResponse) => {
        const [cspHeaders] = result.headers['content-security-policy']
        expect(cspHeaders.key).toEqual('Content-Security-Policy')
        expect(cspHeaders.value).toContain("base-uri 'none';")
        expect(cspHeaders.value).toContain('https://assets.scrivito.com')
        expect(cspHeaders.value).toContain('https://beta-api.scrivito.com')
      })
  })

  describe('if one requests /scrivito', () => {
    it('keeps the original response', () => {
      return LambdaTester(handler)
        .event(buildOriginResponseEvent('200', '/scrivito'))
        .expectResolve((result: AWSLambda.CloudFrontResponse) => {
          expect(result.status).toEqual('200')
          expect(result.statusDescription).toEqual('OK')
          expect(result.headers.server).toEqual([
            { key: 'Server', value: 'MyCustomOrigin' },
          ])
          expect(result.headers['set-cookie']).toEqual([
            { key: 'Set-Cookie', value: 'theme=light' },
          ])
        })
    })
  })

  describe('if the requested page contains a slug and an obj ID', () => {
    it('keeps the original response', () => {
      return LambdaTester(handler)
        .event(buildOriginResponseEvent('200', `/my-slug-${PAGE_ID}`))
        .expectResolve((result: AWSLambda.CloudFrontResponse) => {
          expect(result.status).toEqual('200')
          expect(result.statusDescription).toEqual('OK')
          expect(result.headers.server).toEqual([
            { key: 'Server', value: 'MyCustomOrigin' },
          ])
          expect(result.headers['set-cookie']).toEqual([
            { key: 'Set-Cookie', value: 'theme=light' },
          ])
        })
    })
  })

  describe('if the requested page contains a trailing /', () => {
    it('keeps the original response', () => {
      return LambdaTester(handler)
        .event(buildOriginResponseEvent('200', '/my/perm/link/'))
        .expectResolve((result: AWSLambda.CloudFrontResponse) => {
          expect(result.status).toEqual('200')
          expect(result.statusDescription).toEqual('OK')
          expect(result.headers.server).toEqual([
            { key: 'Server', value: 'MyCustomOrigin' },
          ])
          expect(result.headers['set-cookie']).toEqual([
            { key: 'Set-Cookie', value: 'theme=light' },
          ])
        })
    })
  })

  describe('if the S3 status code is 403', () => {
    describe('if the requested page is not the Scrivito UI', () => {
      describe('if the requested page matches an obj ID', () => {
        it('keeps the original response', () => {
          return LambdaTester(handler)
            .event(buildOriginResponseEvent('403', `/${PAGE_ID}`))
            .expectResolve((result: AWSLambda.CloudFrontResponse) => {
              expect(result.status).toEqual('403')
              expect(result.headers.server).toEqual([
                { key: 'Server', value: 'MyCustomOrigin' },
              ])
              expect(result.headers['set-cookie']).toEqual([
                { key: 'Set-Cookie', value: 'theme=light' },
              ])
            })
        })
      })

      describe('if the requested page contains a slug and an obj ID', () => {
        itRedirectsTo(
          buildOriginResponseEvent('403', `/my-slug-${PAGE_ID}`),
          `/${PAGE_ID}`,
          'the obj ID route',
        )

        itDoesNotAddBlacklistedHeaders(
          buildOriginResponseEvent('403', `/my-slug-${PAGE_ID}`),
        )

        itDoesNotChangeOrRemoveReadOnlyHeaders(
          buildOriginResponseEvent('403', `/my-slug-${PAGE_ID}`),
        )
      })

      describe('if the requested page contains a language prefix, slug and an obj ID', () => {
        itRedirectsTo(
          buildOriginResponseEvent('403', `/de/my-slug-${PAGE_ID}`),
          `/de/${PAGE_ID}`,
          'the obj ID route',
        )

        itDoesNotAddBlacklistedHeaders(
          buildOriginResponseEvent('403', `/de/my-slug-${PAGE_ID}`),
        )

        itDoesNotChangeOrRemoveReadOnlyHeaders(
          buildOriginResponseEvent('403', `/de/my-slug-${PAGE_ID}`),
        )
      })

      describe('if the requested page ends with /', () => {
        itRedirectsTo(
          buildOriginResponseEvent('403', '/my/perm/link/'),
          '/my/perm/link',
          'the page without a trailing /',
        )

        itDoesNotAddBlacklistedHeaders(
          buildOriginResponseEvent('403', '/my/perm/link/'),
        )

        itDoesNotChangeOrRemoveReadOnlyHeaders(
          buildOriginResponseEvent('403', '/my/perm/link/'),
        )
      })

      describe('if the uri / is requested', () => {
        it('keeps the original response', () => {
          return LambdaTester(handler)
            .event(buildOriginResponseEvent('403', '/'))
            .expectResolve((result: AWSLambda.CloudFrontResponse) => {
              expect(result.status).toEqual('403')
              expect(result.headers.server).toEqual([
                { key: 'Server', value: 'MyCustomOrigin' },
              ])
              expect(result.headers['set-cookie']).toEqual([
                { key: 'Set-Cookie', value: 'theme=light' },
              ])
            })
        })
      })

      it('keeps the original response', () => {
        return LambdaTester(handler)
          .event(buildOriginResponseEvent('403'))
          .expectResolve((result: AWSLambda.CloudFrontResponse) => {
            expect(result.status).toEqual('403')
            expect(result.headers.server).toEqual([
              { key: 'Server', value: 'MyCustomOrigin' },
            ])
            expect(result.headers['set-cookie']).toEqual([
              { key: 'Set-Cookie', value: 'theme=light' },
            ])
          })
      })

      it('keeps the original response for paths that look really similar to obj IDs', () => {
        return LambdaTester(handler)
          .event(
            buildOriginResponseEvent('403', '/some/permalink-0123456789abcdeg'), // obj IDs only contain 0-9 and a-f
          )
          .expectResolve((result: AWSLambda.CloudFrontResponse) => {
            expect(result.status).toEqual('403')
            expect(result.headers.server).toEqual([
              { key: 'Server', value: 'MyCustomOrigin' },
            ])
            expect(result.headers['set-cookie']).toEqual([
              { key: 'Set-Cookie', value: 'theme=light' },
            ])
          })
      })
    })

    describe('if the requested page is part of the Scrivito UI', () => {
      beforeEach(() => {
        nock('https://d123.cloudfront.net')
          .get('/scrivito')
          .reply(200, '<html><body>Scrivito UI</body></html>', {
            'content-type': 'my fetch content-type',
            'content-length': 'my fetch content-length',
            date: 'my fetch date',
            'last-modified': 'my fetch last-modified',
            etag: 'my fetch etag',
            'cache-control': 'my fetch cache-control',
            'content-security-policy': 'my fetch content-security-policy',
            'referrer-policy': 'my fetch referrer-policy',
            'strict-transport-security': 'my fetch strict-transport-security',
            'transfer-encoding': 'my fetch transfer-encoding',
            'x-content-type-options': 'my fetch x-content-type-options',
            'x-frame-options': 'my fetch x-frame-options',
            'x-xss-protection': 'my fetch x-xss-protection',
            connection: 'my fetch connection',
            'x-amz-version-id': 'my fetch x-amz-version-id',
            'accept-ranges': 'my fetch accept-ranges',
            server: 'my fetch server',
            'x-cache': 'my fetch x-cache',
            via: 'my fetch via via',
            'x-amz-cf-pop': 'my fetch x-amz-cf-pop',
            'x-amz-cf-id': 'my fetch x-amz-cf-id',
          })
      })

      it('fetches /scrivito from the same distribution and returns the body as a 200', () => {
        return LambdaTester(handler)
          .event(buildOriginResponseEvent('403', '/scrivito/about'))
          .expectResolve((result: AWSLambda.CloudFrontResultResponse) => {
            expect(result.status).toEqual('200')
            expect(result.statusDescription).toEqual('OK')
            expect(result.body).toEqual('<html><body>Scrivito UI</body></html>')
            expect(result.bodyEncoding).toEqual('text')
          })
      })

      it('also fetches the scrivito UI if the path contains a slug and an obj ID', () => {
        return LambdaTester(handler)
          .event(
            buildOriginResponseEvent('403', `/scrivito/my-slug-${PAGE_ID}`),
          )
          .expectResolve((result: AWSLambda.CloudFrontResultResponse) => {
            expect(result.status).toEqual('200')
            expect(result.statusDescription).toEqual('OK')
            expect(result.body).toEqual('<html><body>Scrivito UI</body></html>')
            expect(result.bodyEncoding).toEqual('text')
          })
      })

      it('overwrites selected headers from the fetched resource', () => {
        return LambdaTester(handler)
          .event(buildOriginResponseEvent('403', '/scrivito/about'))
          .expectResolve((result: AWSLambda.CloudFrontResponse) => {
            ;[
              'etag',
              'content-type',
              'date',
              'last-modified',
              'cache-control',
            ].forEach((headerName) => {
              expect(result.headers[headerName]).toEqual([
                { value: `my fetch ${headerName}` },
              ])
            })
          })
      })

      itDoesNotChangeOrRemoveReadOnlyHeaders(
        buildOriginResponseEvent('403', '/scrivito/about'),
      )

      itDoesNotAddBlacklistedHeaders(
        buildOriginResponseEvent('403', '/scrivito/about'),
      )

      it('adds security headers to the fetched resource', () => {
        return LambdaTester(handler)
          .event(buildOriginResponseEvent('403', '/scrivito/about'))
          .expectResolve((result: AWSLambda.CloudFrontResponse) => {
            // Only test some security headers to not repeat all "itAddsHeader" tests.
            expect(result.headers['x-frame-options']).toEqual([
              { key: 'X-Frame-Options', value: 'sameorigin' },
            ])
            expect(result.headers['x-xss-protection']).toEqual([
              { key: 'X-XSS-Protection', value: '1; mode=block' },
            ])
          })
      })
    })
  })

  function itAddsHeader(key: string, value: string) {
    it(`adds header ${key}`, () => {
      return LambdaTester(handler)
        .event(buildOriginResponseEvent())
        .expectResolve((result: AWSLambda.CloudFrontResponse) => {
          expect(result.headers[key.toLowerCase()]).toEqual([{ key, value }])
        })
    })
  }

  // Headers that CloudFront exposes, but fails if they are not set identical to request headers.
  // Source: https://docs.aws.amazon.com/en_us/AmazonCloudFront/latest/DeveloperGuide/lambda-requirements-limits.html#lambda-read-only-headers-origin-response-events
  const READ_ONLY_ORIGIN_RESPONSE_HEADERS = ['transfer-encoding', 'via']

  function itDoesNotChangeOrRemoveReadOnlyHeaders(
    responseEvent: AWSLambda.CloudFrontResponseEvent,
  ) {
    it('does not change or remove read only headers', () => {
      return LambdaTester(handler)
        .event(responseEvent)
        .expectResolve((result: AWSLambda.CloudFrontResponse) => {
          READ_ONLY_ORIGIN_RESPONSE_HEADERS.forEach((headerName) => {
            expect(result.headers[headerName]).toEqual([
              { key: headerName, value: `my cloudfront ${headerName}` },
            ])
          })
        })
    })
  }

  // Headers that CloudFront does not expose and fails if set.
  // Source: https://docs.aws.amazon.com/en_us/AmazonCloudFront/latest/DeveloperGuide/lambda-requirements-limits.html#lambda-blacklisted-headers
  const BLACKLISTED_HEADERS = [
    'connection',
    'expect',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'proxy-connection',
    'trailer',
    'upgrade',
    'x-accel-buffering',
    'x-accel-charset',
    'x-accel-limit-rate',
    'x-accel-redirect',
    'x-amz-cf-*',
    'x-amzn-*',
    'x-cache',
    'x-edge-*',
    'x-forwarded-proto',
    'x-real-ip',
  ]

  function itDoesNotAddBlacklistedHeaders(
    responseEvent: AWSLambda.CloudFrontResponseEvent,
  ) {
    it('does not add blacklisted headers', () => {
      return LambdaTester(handler)
        .event(responseEvent)
        .expectResolve((result: AWSLambda.CloudFrontResponse) => {
          const receivedHeaderNames = Object.keys(result.headers)

          BLACKLISTED_HEADERS.forEach((blacklisted) => {
            if (blacklisted.includes('*')) {
              const prefix = blacklisted.substring(0, blacklisted.indexOf('*'))
              expect(
                receivedHeaderNames.filter((header) =>
                  header.startsWith(prefix),
                ),
              ).toEqual([])
            } else {
              expect(receivedHeaderNames).not.toContain(blacklisted)
            }
          })
        })
    })
  }

  function itRedirectsTo(
    responseEvent: AWSLambda.CloudFrontResponseEvent,
    expectedPath: string,
    humanReadableTarget: string,
  ) {
    it(`redirects permanently to ${humanReadableTarget}`, () => {
      return LambdaTester(handler)
        .event(responseEvent)
        .expectResolve((result: AWSLambda.CloudFrontResultResponse) => {
          expect(result.status).toEqual('301')
          expect(result.statusDescription).toEqual('Moved Permanently')
          expect(result.headers?.location).toEqual([
            { key: 'Location', value: expectedPath },
          ])
          expect(result.headers?.['cache-control']).toEqual([
            {
              key: 'Cache-Control',
              value: 'public, max-age=0, s-maxage=60, must-revalidate',
            },
          ])
          expect(result.bodyEncoding).toEqual('text')
          expect(result.body).toEqual('')
        })
    })
  }

  function buildOriginResponseEvent(
    status: string = '200',
    uri: string = '/picture.jpg',
  ): AWSLambda.CloudFrontResponseEvent {
    return {
      Records: [
        {
          cf: {
            config: {
              distributionDomainName: 'd123.cloudfront.net',
              distributionId: 'EDFDVBD6EXAMPLE',
              eventType: 'origin-response',
            },
            request: {
              clientIp: '2001:0db8:85a3:0:0:8a2e:0370:7334',
              method: 'GET',
              uri,
              querystring: 'size=large',
              headers: {
                host: [{ key: 'Host', value: 'd111111abcdef8.cloudfront.net' }],
                'user-agent': [{ key: 'User-Agent', value: 'curl/7.18.1' }],
              },
            },
            response: {
              status,
              statusDescription: 'OK',
              headers: {
                'cache-control': [
                  {
                    key: 'Cache-Control',
                    value: 'my cloudfront cache-control',
                  },
                ],
                'transfer-encoding': [
                  {
                    key: 'transfer-encoding',
                    value: 'my cloudfront transfer-encoding',
                  },
                ],
                server: [{ key: 'Server', value: 'MyCustomOrigin' }],
                'set-cookie': [{ key: 'Set-Cookie', value: 'theme=light' }],
                via: [{ key: 'via', value: 'my cloudfront via' }],
              },
            },
          },
        },
      ],
    }
  }
})
