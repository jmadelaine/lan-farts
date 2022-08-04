import fs from 'fs'
import { promisify } from 'util'
import { assertThat, isRecordOf } from 'ts-guardian'

const isLibrary = isRecordOf('string')

const libraryPath = 'library.json'

const exists = promisify(fs.access)
const read = promisify(fs.readFile)
const write = promisify(fs.writeFile)

const get = async () => {
  try {
    await exists(libraryPath, fs.constants.F_OK)
    const parsed = JSON.parse(await read(libraryPath))
    assertThat(parsed, isLibrary)
    return parsed
  } catch {
    return {}
  }
}

const add = async (id, url) => {
  let parsed
  try {
    await exists(libraryPath, fs.constants.F_OK)
    parsed = JSON.parse(await read(libraryPath))
    assertThat(parsed, isLibrary)
  } catch {
    parsed = {}
  }
  parsed[id] = url
  try {
    await write(libraryPath, JSON.stringify(parsed))
  } catch {}
}

export default {
  get,
  add,
}
