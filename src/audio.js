import fetch from 'node-fetch'
import ffPlay from 'ffplay'
import library from './library.js'

const urlFetchPrefix = 'https://freesound.org/search/?q='
const mp3SrcRegex = /class="mp3_file" href="(.+?\.mp3)" title="mp3 file">(.+?) - mp3 version<\/a>/gi

let player = undefined

export const playRandomSound = async (keyword, searchOnline) => {
  player?.stop()
  if (!keyword) return

  if (!searchOnline) {
    const matchingKeys = Object.keys(await library.get()).filter(k => k.toLowerCase().includes(keyword.toLowerCase()))
    if (!matchingKeys.length) return
    return playLibrarySound(matchingKeys[Math.floor(Math.random() * matchingKeys.length)])
  }

  // Fetch Sound Bible's search results as HTML
  const htmlRes = await (await fetch(`${urlFetchPrefix}${keyword}`)).text()
  if (!htmlRes) return

  // Parse all the sound file URLs from the HTML
  const sounds = Array.from(htmlRes.matchAll(mp3SrcRegex) ?? [])
    .map(m => ({ url: m[1], name: m[2] }))
    .filter(s => !!s.url && !!s.name)
  if (!sounds.length) return

  const sound = sounds[Math.floor(Math.random() * sounds.length)]
  player = new ffPlay(sound.url)
  return sound
}

export const playLibrarySound = async name => {
  player?.stop()
  if (!name) return
  const url = (await library.get())[name]
  if (!url) return
  player = new ffPlay(url)
  return { name, url }
}

export const textToSpeech = async (text, voice) => {
  player?.stop()
  try {
    // TikTok's text to speech API
    const res = await (
      await fetch(
        `https://api16-normal-useast5.us.tiktokv.com/media/api/text/speech/invoke/?text_speaker=${voice}&req_text=${encodeURIComponent(
          text
        )}&speaker_map_type=0`,
        { method: 'POST' }
      )
    ).json()
    const voiceString = res?.data?.v_str
    if (!voiceString) return false

    player = new ffPlay(`data:audio/mpeg;base64,${voiceString}`)
    return true
  } catch {
    return false
  }
}

export const stopSound = () => {
  player?.stop()
}
