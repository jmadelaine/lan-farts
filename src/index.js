import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { port, url } from './config.js'
import { playSound } from './audio.js'

const app = express()

console.log('Farts are brewing...')

app.use(cors({ credentials: true, origin: '*' }))

// parse application/json
app.use(bodyParser.json())

app.get('/play', async (req, res) => {
  console.log(`search: ${req.query.sound}`)
  const sound = await playSound(req.query.sound)
  if (!sound) res.send(`Search: ${req.query.sound}<br/>Couldn't find a matching sound 😢`)
  else res.send(`Search: ${req.query.sound}<br/>Playing: <a href="${sound.url}" target="_blank">${sound.name}</a>`)
})

app.listen({ port }, () => {
  console.log(`Ready to fart at ${url}/play?sound=fart`)
})
