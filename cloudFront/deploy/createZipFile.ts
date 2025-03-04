import JSZip from 'jszip'

/** Creates a zip file containing index.js with the given content */
export async function createZipFile(indexJsContent: string): Promise<Buffer> {
  const zip = new JSZip()
  zip.file('index.js', indexJsContent, { date: new Date(0) })

  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
}
