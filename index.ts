import * as express from 'express'
import { initDatabase, insert, query } from './db'
import { allTables } from './db_tables'
import { BadRequestError } from 'restify-errors'
import { hasPhoneConnected, sendSms } from './socket_module'

let queueBusy = false
let queueEmpty = false

const port = parseInt(process.env.PORT ?? '') || 8888

const app = express()
app.use(express.urlencoded({ extended: true }))
app.use(express.json({ limit: 64 * 1024 * 1024 }))

const httpServer = require('../sms-socket-api/socket_module').setup(app, async sms => {
  const { sender, message } = sms

  if (!sender) {
    console.error('got SMS with no sender info')
    return
  } else if (!message) {
    console.error('got SMS with no body')
    return
  }

  try {
    const receivedId = await insert(allTables[0], { sender, text: message })
    console.log(`received sms from ${sender}`, message, receivedId)
  } catch (e) {
    console.error(`could not store received messages: ${e}`)
  }
})

app.get('/', (httpReq, httpRes) => {
  httpRes.json({ OK: true })
})

app.post('/sms', async (httpReq, httpRes) => {
  const { body, recipient } = httpReq.body
  if (!body) {
    throw new BadRequestError('No body provided')
  }

  if (!recipient) {
    throw new BadRequestError('No recipient provided')
  }

  const id = await insert(allTables[1], { body, recipient })
  httpRes.json({ status: 'waiting', id })
  queueEmpty = false
})

async function processQueue () {
  if (queueBusy || queueEmpty || !hasPhoneConnected()) {
    return
  }

  queueBusy = true
  const tblName = allTables[1].name
  const queuedMessage = await query(`select * from ${tblName} limit 1`)
  if (queuedMessage.length) {
    const { id, body, recipient } = queuedMessage[0]
    if (sendSms(recipient, body)) {
      const sentId = await insert(allTables[2], { body, recipient })
      if (sentId) {
        await query(`delete from ${tblName} where id=${id}`)
        console.log(`sent SMS to ${recipient} [id=${sentId}]`, body)
      }
    }
  } else {
    queueEmpty = true
  }

  queueBusy = false
}

initDatabase()
  .then(() => {
    httpServer.listen(port, () => {
      console.log(`server listening on ${port}`)

      setInterval(processQueue, 500)
    })
  })
  .catch(err => {
    console.error(`cannot initialise database: ${err}`)
    process.exit(1)
  })
