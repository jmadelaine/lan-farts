import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { port, url } from './config.js'
import { playLibrarySound, playRandomSound, stopSound } from './audio.js'
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

app.get('/', async (req, res) => {
  const data = await library.get()
  const keys = Object.keys(data)

  res.send(`
  <div>
    <a href="/stop">Stop sound</a>
    <h1>Library</h1>
    <div>
    <div>Play a random sound</div>
      <form id="random-form">
        <input name="keyword" placeholder="Keyword" />
        <input name="search-online" type="checkbox"/> <span>Search online</span>
        <button type="submit">Play</button>
      </form>
    </div>
    <div>
      <div>Add a new sound to the library</div>
      <form id="add-form">
        <input name="name" placeholder="Name" />
        <input name="url" placeholder="URL" />
        <button type="submit">Add</button>
      </form>
    </div>
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
