import { writeFile, readFile } from 'node:fs/promises'
import path from 'node:path'

import RAW_PRESIDENTS from './../db/raw-presidents.json' assert { type: 'json' }
import { logInfo, logSuccess } from './log.js'

const STATICS_PATH = path.join(process.cwd(), './assets/static/presidents')
const DB_PATH = path.join(process.cwd(), './db')

const presidents = await Promise.all(
  RAW_PRESIDENTS.map(async (presidentInfo) => {
    const { slug: id, title, _links: links } = presidentInfo
    const { rendered: name } = title

    const { 'wp:attachment': attachment } = links
    const { href: imageApiEndpoint } = attachment[0]

    logInfo(`Fetching attachment for president: ${name}`)

    const imageApiRequest = new Request(imageApiEndpoint, {
      timeout: 5000,
      method: 'GET'
    })

    const responseImageEndpoint = await fetch(imageApiRequest)
    const data = await responseImageEndpoint.json()
    const [imageInfo] = data
    const {
      guid: { rendered: imageUrl }
    } = imageInfo

    const fileExtension = imageUrl.split('.').at(-1)

    logInfo(`Fetching image for president: ${name}`)

    const responseImage = await fetch(imageUrl)
    const arrayBuffer = await responseImage.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    logInfo(`Writing image to disk ${name}`)
    const imageFileName = `${id}.${fileExtension}`
    await writeFile(`${STATICS_PATH}/${imageFileName}`, buffer)

    logInfo(`Everything is done! ${name}`)
    return { id, name, image: imageFileName, teamId: 0 }
  })
)

logSuccess('All presidents are done!')
await writeFile(
  `${DB_PATH}/presidents.json`,
  JSON.stringify(presidents, null, 2)
)
