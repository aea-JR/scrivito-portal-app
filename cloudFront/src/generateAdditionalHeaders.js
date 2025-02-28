const fs = require('fs')

const csp = fs
  .readFileSync('../dist/_headers')
  .toString()
  .match(/(?<=Content-Security-Policy: )[^\n]+/)
  .toString()
module.exports = {
  'content-security-policy': [{ key: 'Content-Security-Policy', value: csp }],
  'referrer-policy': [
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  ],
  'strict-transport-security': [
    {
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    },
  ],
  'x-content-type-options': [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
  ],
  'x-frame-options': [{ key: 'X-Frame-Options', value: 'sameorigin' }],
  'x-xss-protection': [{ key: 'X-XSS-Protection', value: '1; mode=block' }],
}
