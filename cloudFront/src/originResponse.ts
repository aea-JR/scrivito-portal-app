import { IncomingHttpHeaders } from 'http'
import https from 'https'

const { basicAuth } = preval.require<{ basicAuth: string }>(
  './originResponseEnv.js',
)

interface RedirectionStructure {
  [key: string]: string
}

export async function handler(
  event: AWSLambda.CloudFrontResponseEvent,
  context: AWSLambda.Context,
): Promise<AWSLambda.CloudFrontResponse | AWSLambda.CloudFrontResultResponse> {
  const { config, request, response } = event.Records[0].cf
  console.log(
    `Processing ${request.uri} (Origin Status-Code: ${response.status})`,
  )

  const readCloudFrontOnlyHeaders: AWSLambda.CloudFrontHeaders = {}
  READ_ONLY_ORIGIN_RESPONSE_HEADERS.forEach((headerName) => {
    readCloudFrontOnlyHeaders[headerName] = response.headers[headerName]
  })

  if (isAmzRedirect(response.headers)) {
    const location =
      response.headers['x-amz-website-redirect-location'][0].value
    return movedPermanentlyTo(location, readCloudFrontOnlyHeaders)
  }

  if (isNotFoundStatusCode(response.status)) {
    const objId = recognizeObjId(request.uri)
    if (objId && `/${objId}` !== request.uri) {
      const path = `/${objId}`
      return movedPermanentlyTo(path, readCloudFrontOnlyHeaders)
    }
    if (request.uri !== '/' && request.uri.match(DANGLING_SLASHES)) {
      const normalizedPath = request.uri.replace(DANGLING_SLASHES, '')
      return movedPermanentlyTo(normalizedPath, readCloudFrontOnlyHeaders)
    }

    return movedTo404(config.distributionDomainName, readCloudFrontOnlyHeaders)
  }

  Object.assign(response.headers, ADDITIONAL_CLOUD_FRONT_HEADERS)
  if (
    request.querystring.includes('status-code=404-not-found') ||
    request.uri == '/404' ||
    request.uri == '/404.html'
  ) {
    return NotFound(response)
  }

  return response
}

// More than a single slash at the start and trailing slashes
const DANGLING_SLASHES = /^\/+(?=\/)|\/+$/g

// CloudFront using a private S3 bucket returns 403 for not found items
const NOT_FOUND_STATUS_CODES = ['403', '404']

function isAmzRedirect(headers: AWSLambda.CloudFrontHeaders): boolean {
  return Object.keys(headers).includes('x-amz-website-redirect-location')
}

function isNotFoundStatusCode(s3Status: string): boolean {
  return NOT_FOUND_STATUS_CODES.includes(s3Status)
}

function recognizeObjId(pathToRecognize: string): string | null {
  const match = pathToRecognize.match(/-([0-9a-f]{16})$/)
  return match && match[1]
}

function recognizeLocale(pathToRecognize: string): string | null {
  const match = pathToRecognize.match(/^\/\w{2}\//)
  return match && match[0] ? match[0].substring(1, 3) : null
}

async function movedPermanentlyTo(
  urlOrPath: string,
  readCloudFrontOnlyHeaders: AWSLambda.CloudFrontHeaders,
): Promise<AWSLambda.CloudFrontResultResponse> {
  console.log(`Permanently redirecting to ${urlOrPath} (Status-Code: 301)`)

  return {
    status: '301',
    statusDescription: 'Moved Permanently',
    headers: {
      ...readCloudFrontOnlyHeaders,
      'cache-control': [
        {
          key: 'Cache-Control',
          value: 'public, max-age=0, s-maxage=60, must-revalidate',
        },
      ],
      location: [{ key: 'Location', value: urlOrPath }],
    },
    body: '',
    bodyEncoding: 'text',
  }
}

async function NotFound(response: any) {
  console.log('Responding with custom 404 html file (Status-Code: 404)')
  return { ...response, status: '404', statusDescription: 'Not Found' }
}

async function movedTo404(
  domain: string,
  readCloudFrontOnlyHeaders: AWSLambda.CloudFrontHeaders,
) {
  console.log(
    'GET /404.html (Status-Code: 404), but deliver index.html until there is a custom 404.html',
  )
  let host = domain
  if (basicAuth) {
    host = `${basicAuth}@${domain}`
  }
  const { headers, body } = await httpsGet(`https://${host}/index.html`)

  return {
    status: '404',
    statusDescription: 'Not Found',
    headers: {
      ...readCloudFrontOnlyHeaders,
      'cache-control': [
        {
          key: 'Cache-Control',
          value: 'public, max-age=0, s-maxage=60, must-revalidate',
        },
      ],
    },
    ...body,
  }
}

async function httpsGet(
  url: string,
): Promise<{ body: string; headers: IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (resp) => {
        const headers = resp.headers
        let body = ''

        resp.on('data', (chunk) => (body += chunk))
        resp.on('end', () => resolve({ headers, body }))
      })
      .on('error', (err) => reject(err))
  })
}

// Headers that CloudFront exposes, but fails if they are not set identical to request headers.
// Source: https://docs.aws.amazon.com/en_us/AmazonCloudFront/latest/DeveloperGuide/lambda-requirements-limits.html#lambda-read-only-headers-origin-response-events
const READ_ONLY_ORIGIN_RESPONSE_HEADERS = ['transfer-encoding', 'via']

const WHITELIST_HEADER_NAMES = [
  'cache-control',
  'content-type',
  'date',
  'etag',
  'last-modified',
]

function whitelistHttpHeaders(
  headers: IncomingHttpHeaders,
): IncomingHttpHeaders {
  const whitelistedHttpHeaders: IncomingHttpHeaders = {}

  Object.entries(headers).forEach(([headerName, value]) => {
    if (WHITELIST_HEADER_NAMES.includes(headerName.toLowerCase())) {
      whitelistedHttpHeaders[headerName] = value
    }
  })

  return whitelistedHttpHeaders
}

function headersToCloudFrontHeaders(
  headers: IncomingHttpHeaders,
): AWSLambda.CloudFrontHeaders {
  const cloudFrontHeaders: AWSLambda.CloudFrontHeaders = {}

  Object.entries(headers).forEach(([headerName, value]) => {
    if (!value) return
    cloudFrontHeaders[headerName] = Array.isArray(value)
      ? value.map((v) => ({ value: v }))
      : [{ value }]
  })

  return cloudFrontHeaders
}

const ADDITIONAL_CLOUD_FRONT_HEADERS =
  preval.require<AWSLambda.CloudFrontHeaders>('./generateAdditionalHeaders.js')
