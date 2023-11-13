import * as express from 'express'
import { initDatabase, query, allTables } from './db'
import { hasPhoneConnected, sendSms, setup } from './socket_module'
import { getMessages, storeQueuedMessage, storeReceivedMessage, storeSentMessage } from './db_messages'
import { BadRequestError } from 'restify-errors'

const port = 8888

let queueBusy = false
let queueEmpty = false

const app = express()
app.use(express.urlencoded({ extended: true }))
app.use(express.json({ limit: 64 * 1024 * 1024 }))

const httpServer = setup(app, async sms => {
  try {
    const { sender, message } = sms
    const receivedId = await storeReceivedMessage(sender, message)
    console.log(`received sms from ${sender}`, message, receivedId)
  } catch (e) {
    console.error(`could not store received SMS: ${e}`)
  }
})

app.get('/', (httpReq, httpRes) => {
  httpRes.json({ OK: true })
})

app.post('/sms', async (httpReq, httpRes) => {
  const { body, recipient } = httpReq.body
  const id = await storeQueuedMessage(recipient, body)
  httpRes.json({ status: 'waiting', id })
  queueEmpty = false
})

app.get('/sms/:kind', async (httpReq, httpRes) => {
  const limit = parseInt(`${httpReq.query.limit}`) || 50
  const offset = parseInt(`${httpReq.query.from}`) || 0
  let messages: any[]

  if (httpReq.params.kind === 'sent') {
    messages = await getMessages(allTables[2].name, limit, offset)
  } else if (httpReq.params.kind === 'received') {
    messages = await getMessages(allTables[0].name, limit, offset)
  } else {
    throw new BadRequestError('invalid type')
  }
  httpRes.json(messages)
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
      const sentId = await storeSentMessage(body, recipient, id)
      if (sentId) {
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
