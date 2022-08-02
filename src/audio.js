import fetch from 'node-fetch'
import ffPlay from 'ffplay'

const urlFetchPrefix = 'https://freesound.org/search/?q='
const mp3SrcRegex = /class="mp3_file" href="(.+?\.mp3)" title="mp3 file">(.+?) - mp3 version<\/a>/gi

let player = undefined

export const playSound = async searchString => {
  // Stop previous sound before playing a new one
  if (player) player.stop()

  if (!searchString) return

  // Fetch Sound Bible's search results as HTML
  const htmlRes = await (await fetch(`${urlFetchPrefix}${searchString}`)).text()
  if (!htmlRes) return

  // Parse all the sound file URLs from the HTML
  const sounds = Array.from(htmlRes.matchAll(mp3SrcRegex) ?? [])
    .map(m => ({ url: m[1], name: m[2] }))
    .filter(s => !!s.url && !!s.name)
  if (!sounds.length) return

  // Random sound
  const sound = sounds[Math.floor(Math.random() * sounds.length)]

  // Automatically plays sound on load
  player = new ffPlay(sound.url)

  return sound
}
