import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { port, url } from './config.js'
import { playLibrarySound, playRandomSound, stopSound, textToSpeech } from './audio.js'
import library from './library.js'
import { assertThat, is } from 'ts-guardian'

const app = express()

console.log('Farts are brewing...')

app.use(cors({ credentials: true, origin: '*' }))

// parse application/json
app.use(bodyParser.json())

const wrappedResponse = content => `
  <div>
    <a href="/stop">Stop sound</a>
    <a href="/">Library</a>
    ${content}
  </div>
  `

app.get('/stop', async (req, res) => {
  stopSound()
  res.send(wrappedResponse('<div>Stopped sound</div>'))
})

app.get('/play/random/:keyword', async (req, res) => {
  const keyword = req.params.keyword
  const searchOnline = req.query.searchOnline === 'true'
  if (!keyword) return res.send(wrappedResponse('<div>You need to provide a keyword, e.g. "/play/random/fart"</div>'))
  const sound = await playRandomSound(keyword, searchOnline)
  if (!sound) res.send(wrappedResponse(`<div>Keyword: ${keyword}<br/>Couldn't find a matching sound 😢</div>`))
  else
    res.send(
      wrappedResponse(
        `<div>Keyword: ${keyword}<br/>Playing: <a href="${sound.url}" target="_blank">${sound.name}</a></div>`
      )
    )
})

app.get('/play/:name', async (req, res) => {
  const name = req.params.name
  if (!name)
    return res.send(
      wrappedResponse('<div>You need to provide a name of a sound in the library, e.g. "/play/fart"</div>')
    )
  const sound = await playLibrarySound(name)
  if (!sound) res.send(wrappedResponse(`<div>Name: ${name}<br/>Couldn't find a matching sound 😢</div>`))
  else res.send(wrappedResponse(`<div>Playing: <a href="${sound.url}" target="_blank">${sound.name}</a></div>`))
})

app.get('/add', async (req, res) => {
  const data = req.query
  try {
    assertThat(data, is({ name: 'string', url: 'string' }))
  } catch {
    return res.send(
      wrappedResponse('<div>Error adding sound to library. You need to provide "name" and "url" as query params</div>')
    )
  }
  const { name, url } = data
  await library.add(name, url)
  res.send(wrappedResponse(`<div>Added "${name}" to library</div>`))
})

app.get('/say/:text', async (req, res) => {
  const text = req.params.text
  if (!text) return res.send(wrappedResponse('<div>You need to provide some text, e.g. "/say/hello"</div>'))
  const voice = req.query.voice
  const success = await textToSpeech(text, voice)
  if (success) res.send(wrappedResponse(`<div>Speaking: ${text}</div><div>Voice: ${voice}</div>`))
  else res.send(wrappedResponse(`<div>Error generating audio</div>`))
})

app.get('/', async (req, res) => {
  const data = await library.get()
  const keys = Object.keys(data)

  res.send(`
  <div>
    <a href="/stop">Stop sound</a>
    <h1>Library</h1>
    <div>Text to speech</div>
    <form id="text-to-speech-form">
      <input name="text" placeholder="Say something" />
      <select name="voice">
        <option value="en_us_001">English US - Female</option>
        <option value="en_us_006">English US - Male 1</option>
        <option value="en_us_007">English US - Male 2</option>
        <option value="en_us_009">English US - Male 3</option>
        <option value="en_us_010">English US - Male 4</option>
        <option value="en_uk_001">English UK - Male 1</option>
        <option value="en_uk_003">English UK - Male 2</option>
        <option value="en_au_001">English AU - Female</option>
        <option value="en_au_002">English AU - Male</option>
        <option value="fr_001">French - Male 1</option>
        <option value="fr_002">French - Male 2</option>
        <option value="de_001">German - Female</option>
        <option value="de_002">German - Male</option>
        <option value="es_002">Spanish - Male</option>
        <option value="es_mx_002">Spanish MX - Male</option>
        <option value="br_001">Portuguese BR - Female 1</option>
        <option value="br_003">Portuguese BR - Female 2</option>
        <option value="br_004">Portuguese BR - Female 3</option>
        <option value="br_005">Portuguese BR - Male</option>
        <option value="id_001">Indonesian - Female</option>
        <option value="jp_001">Japanese - Female 1</option>
        <option value="jp_003">Japanese - Female 2</option>
        <option value="jp_005">Japanese - Female 3</option>
        <option value="jp_006">Japanese - Male</option>
        <option value="kr_002">Korean - Male 1</option>
        <option value="kr_004">Korean - Male 2</option>
        <option value="kr_003">Korean - Female</option>
        <option value="en_us_ghostface">Ghostface (Scream)</option>
        <option value="en_us_chewbacca">Chewbacca (Star Wars)</option>
        <option value="en_us_c3po">C3PO (Star Wars)</option>
        <option value="en_us_stitch">Stitch (Lilo & Stitch)</option>
        <option value="en_us_stormtrooper">Stormtrooper (Star Wars)</option>
        <option value="en_us_rocket">Rocket (Guardians of the Galaxy)</option>
        <option value="en_female_f08_salut_damour">Alto</option>
        <option value="en_male_m03_lobby">Tenor</option>
        <option value="en_male_m03_sunshine_soon">Sunshine Soon</option>
        <option value="en_female_f08_warmy_breeze">Warmy Breeze</option>
      </select>
      <button type="submit">Say</button>
    </form>
    <div>Play a random sound</div>
    <form id="random-form">
      <input name="keyword" placeholder="Keyword" />
      <input name="search-online" type="checkbox"/> <span>Search online</span>
      <button type="submit">Play</button>
    </form>
    <div>Add a new sound to the library</div>
    <form id="add-form">
      <input name="name" placeholder="Name" />
      <input name="url" placeholder="URL" />
      <button type="submit">Add</button>
    </form>
    ${
      !keys.length
        ? "<div>It's awfully quiet in here...</div>"
        : keys
            .sort()
            .map(k => `<div><a href="/play/${k}">${k}</a></div>`)
            .join('')
    }
  </div>
  <script>
  document.getElementById('text-to-speech-form').onsubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const text = formData.get('text')
    const voice = formData.get('voice')
    if(!text) return 
    window.location.href = '/say/' + text + '?voice=' + voice
  }
  
  document.getElementById('add-form').onsubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const name = formData.get('name')
    const url = formData.get('url')
    if(!name || !url) return 
    window.location.href = '/add?name=' + name + '&url=' + url
  }

  document.getElementById('random-form').onsubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const keyword = formData.get('keyword')
    const searchOnline = formData.get('search-online')
    if(!keyword) return 
    window.location.href = '/play/random/' + keyword + '?searchOnline=' + (searchOnline ? 'true' : 'false') 
  }

  </script>
  `)
})

app.listen({ port }, () => {
  console.log(`Ready to fart ${url}`)
})
