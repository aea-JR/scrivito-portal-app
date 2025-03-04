import path from 'path'
import klaw from 'klaw'
import fse from 'fs-extra'
import { SingleBar } from 'cli-progress'
import { createProgressBar } from './createProgressBar'
import { removePrefix } from './removePrefix'
import { removeSuffix } from './removeSuffix'
import { isAssetKey } from './isAssetKey'
import { ensureEnv } from '../utils'
import { isFileModified } from './isFileModified'
import { listHeadObjects, HeadObjects, isHeadObject } from './listHeadObjects'
import { contentType } from './contentType'
import { cacheControl } from './cacheControl'
import { uploadToS3 } from './uploadToS3'
import { cleanUp } from './cleanUp'

const bucket = ensureEnv('S3_BUCKET')

// TODO: No longer generated the following files during prerender.
const FILES_TO_BE_IGNORED = [
  '_cms_redirects',
  '_hardcoded_redirects',
  '_headers',
  '_redirects',
  '.DS_Store',
]

export interface FileUpload {
  key: string
  contentType: string | undefined
  cacheControl: string
  absolutePath: string
  relativePath: string
}

async function go() {
  console.log('⏩  Starting upload... ⏩')
  console.group()
  const buildDirectory = process.env.BUILD_DIRECTORY || '../dist'
  const prerenderedFolder = path.resolve(buildDirectory)

  const assetFiles: FileUpload[] = []
  const otherFiles: FileUpload[] = []
  const redirectFiles: FileUpload[] = []

  for await (const file of klaw(prerenderedFolder)) {
    if (!file.stats.isDirectory()) {
      const absolutePath = file.path
      const relativePath = removePrefix(absolutePath, prerenderedFolder)
      if (FILES_TO_BE_IGNORED.includes(relativePath)) continue

      const key = removeSuffix(relativePath, '/index.html')
      const fileUpload: FileUpload = {
        key,
        contentType: contentType(relativePath),
        cacheControl: cacheControl(key),
        absolutePath,
        relativePath,
      }
      isAssetKey(key)
        ? assetFiles.push(fileUpload)
        : otherFiles.push(fileUpload)
    }
  }

  const redirects = await prepareRedirects(prerenderedFolder)

  for (const redirect of redirects) {
    const fileUpload: FileUpload = {
      key: redirect.source,
      contentType: 'text/html',
      cacheControl: cacheControl(redirect.source),
      absolutePath: redirect.source,
      relativePath: redirect.source,
    }

    redirectFiles.push(fileUpload)
  }

  const headObjects = await listHeadObjects(bucket)

  const progressBar = createProgressBar(
    'files uploaded',
    assetFiles.length + otherFiles.length + redirectFiles.length,
  )

  let modifiedCount = 0
  try {
    modifiedCount += await uploadFiles(assetFiles, headObjects, progressBar)
    modifiedCount += await uploadFiles(otherFiles, headObjects, progressBar)
    modifiedCount += await uploadFiles(
      redirectFiles,
      headObjects,
      progressBar,
      true,
      redirects,
    )
  } finally {
    progressBar.stop()
  }

  console.groupEnd()
  console.log(
    `⌛ Upload succeeded! Number of uploaded files: ${modifiedCount} ⌛`,
  )

  console.log('♻ Cleaning up... ♻')
  const uploadedKeys: Set<string> = new Set(
    [...otherFiles, ...assetFiles, ...redirectFiles].map(({ key }) => key),
  )
  await cleanUp(
    bucket,
    uploadedKeys,
    Object.values(headObjects).filter(isHeadObject),
  )
  console.log('♻ Cleaning up succeeded! ♻')
  console.log(`   Used bucket: ${bucket}`)
}

/** Prepare / create necessary keys to upload from redirects */
/* Use a list of files for the final redirects.
 * Do not create them upfront, as we have a mixture of CMS redirects,
 * that can be created programmatically and a hardcoded list, that can't be
 * processed in a comfortable way.
 * So we create those final redirect files in one go, upload them to S3 and
 * also can check for modifications and / or removal.
 */
async function prepareRedirects(
  prerenderedFolder: string,
): Promise<{ source: string; target: string }[]> {
  const redirectsFiles = [
    `${prerenderedFolder}/_cms_redirects`,
    `${prerenderedFolder}/_hardcoded_redirects`,
  ]

  const redirectsList: { source: string; target: string }[] = []

  for (const fileName of redirectsFiles) {
    let data = ''

    try {
      data = await fse.readFile(fileName, 'utf8')
    } catch (error) {
      data = ''
      console.log(error)
    }

    if (data) {
      const lines = data.split('\n')

      // In case the read file has been empty or just included a new line break
      if (!lines.length || (lines.length === 1 && lines[0] === '')) {
        break
      }

      // Processing redirect files
      // Removal of whitespaces, empty lines and comments
      const splitted: Array<Array<string>> = lines
        .map((line) => line.trim())
        .filter((line) => line)
        .filter((line) => !line.startsWith('#'))
        .map((line) => line.split(/\s+/g))

      // Remove leading slash from source: otherwise it creates a folder without a name
      splitted.forEach((redirect) => {
        redirectsList.push({
          source: redirect[0].replace(/^\//g, ''),
          target: redirect[1],
        })
      })
    } else {
      console.log(`${fileName} does not exist or is empty...`)
    }
  }
  return redirectsList
}

/** Returns the number of new or modified files */
async function uploadFiles(
  files: FileUpload[],
  headObjects: HeadObjects,
  progressBar: SingleBar,
  isRedirect: boolean = false,
  redirectData?: { source: string; target: string }[],
): Promise<number> {
  let modifiedCount = 0
  for (const file of files) {
    const { key, contentType, cacheControl, absolutePath, relativePath } = file
    let body: Buffer | string = ''
    let target: string = ''

    if (!isRedirect) {
      body = await fse.readFile(absolutePath)
    } else {
      if (redirectData && redirectData.length > 0) {
        // Find all the prepared redirect data objects for the current key.
        // Return e.g. [{ source: '/my-new-page', target: '/my-target-page' }] for key '/my-new-page'.
        const targets = redirectData.filter((data) => data.source === key)

        if (targets.length > 1) {
          console.log(
            `🙋 Potential redirect conflict! A redirect with source ${key} has been defined multiple times.`,
          )
        }

        if (targets.length > 0) {
          target = targets[0].target
          body = target
        }
      }
    }

    const isModified = await isFileModified(file, body, headObjects[file.key])

    // Different handling for "normal" files and redirects
    if (isModified && isRedirect) {
      await uploadToS3({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
        CacheControl: cacheControl,
        Body: target,
        WebsiteRedirectLocation: target,
      })

      modifiedCount += 1
    } else if (isModified) {
      await uploadToS3({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
        CacheControl: cacheControl,
        Body: body,
      })

      modifiedCount += 1
    }

    progressBar.increment(1, { currentItem: relativePath })
  }
  return modifiedCount
}

go().catch((e) => {
  console.log('❌ An error occurred!', e)
  process.exitCode = 1
})
