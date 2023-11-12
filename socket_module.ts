import { type Express } from 'express'
import { createServer } from 'http'
import { Server, type Socket } from 'socket.io'

export declare interface ReceivedSms {
  date: string
  message: string
  sender: string
}

export type ReceivedSmsHandler = (sms: ReceivedSms) => void

let io: Server | null = null
let phoneSocket: Socket | null = null
let smsHandler: ReceivedSmsHandler | null = null

function unsetPhoneSocket () {
  if (phoneSocket) {
    phoneSocket.removeAllListeners()
    phoneSocket = null
  }
}

function onPhoneConnected (socket: Socket) {
  unsetPhoneSocket()

  if (!io) {
    return
  }

  console.log('phone connected')

  // inform all clients
  io.emit('hello', { message: `hello, ${socket.id}` })

  // emit to new client
  socket.emit('your-id', { id: socket.id })

  phoneSocket = socket

  phoneSocket.on('send-sms', data => {
    console.log('would send SMS', data)
  })

  phoneSocket.on('received-sms', (data: string) => {
    const sms = JSON.parse(data) as ReceivedSms
    if (smsHandler) {
      smsHandler(sms)
    } else {
      console.log('received sms', sms)
    }
  })

  phoneSocket.on('disconnect', () => {
    unsetPhoneSocket()
    console.log('phone disconnected')
  })
}

export function sendSms (receiver: string, body: string) {
  if (phoneSocket) {
    phoneSocket.emit('send-sms', { receiver, body })
  }
  return !!phoneSocket
}

export function setup (app: Express, receiveHandler: ReceivedSmsHandler) {
  if (io) {
    throw new Error('Already configured')
  }

  const httpServer = createServer(app)

  io = new Server(httpServer, { pingTimeout: 2000, pingInterval: 2000 })
  io.on('connection', onPhoneConnected)
  smsHandler = receiveHandler

  return httpServer
}

export function hasPhoneConnected () {
  return !!phoneSocket
}
