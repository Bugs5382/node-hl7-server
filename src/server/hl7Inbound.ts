import EventEmitter from 'events'
import net, { Socket } from 'net'
import tls from 'tls'
import { FileBatch, Batch, Message, isBatch, isFile } from 'node-hl7-client'
import { CR, FS, VT } from '../utils/constants'
import { ListenerOptions, normalizeListenerOptions } from '../utils/normalize.js'
import { InboundRequest } from './modules/inboundRequest.js'
import { SendResponse } from './modules/sendResponse.js'
import { Server } from './server.js'

/**
 * Inbound Handler
 * @description The handler that will handle the user parsing a received message by the client to the server.
 * @since 1.0.0
 * @example
 * In this example, we are processing the results in an async handler.
 *````
 *  const IB_ADT = server.createInbound({port: 3000}, async (req, res) => {
 *    const messageReq = req.getMessage()
 *    const messageRes = res.getAckMessage()
 *  })
 *```
 */
export type InboundHandler = (req: InboundRequest, res: SendResponse) => Promise<void>

/**
 * Listener Class
 * @since 1.0.0
 * @extends EventEmitter
 */
export class Hl7Inbound extends EventEmitter {
  /** @internal */
  private readonly _handler: (req: InboundRequest, res: SendResponse) => void
  /** @internal */
  _main: Server
  /** @internal */
  _opt: ReturnType<typeof normalizeListenerOptions>
  /** @internal */
  private readonly _socket: net.Server | tls.Server
  /** @internal */
  private readonly _sockets: Socket[]

  /**
   * Build a Listener
   * @since 1.0.0
   * @param server
   * @param props
   * @param handler
   */
  constructor (server: Server, props: ListenerOptions, handler: InboundHandler) {
    super()
    this._handler = handler
    this._main = server
    this._opt = normalizeListenerOptions(props)
    this._sockets = []

    this._listen = this._listen.bind(this)
    this._onTcpClientConnected = this._onTcpClientConnected.bind(this)
    this._socket = this._listen()
  }

  /** Close Listener Instance.
   * This be called for each listener, but if the server instance is closed shut down, this will also fire off.
   * @since 1.0.0 */
  async close (): Promise<boolean> {
    this._sockets.forEach((socket) => {
      socket.destroy()
    })

    this._socket?.close(() => {
      this._socket?.unref()
    })

    return true
  }

  /** @internal */
  private _listen (): net.Server | tls.Server {
    let socket: net.Server | tls.Server
    const port = this._opt.port
    const bindAddress = this._main._opt.bindAddress
    const ipv6 = this._main._opt.ipv6

    if (typeof this._main._opt.tls !== 'undefined') {
      const { key, cert, requestCert, ca } = this._main._opt.tls
      socket = tls.createServer({ key, cert, requestCert, ca }, socket => this._onTcpClientConnected(socket))
    } else {
      socket = net.createServer(socket => this._onTcpClientConnected(socket))
    }

    socket.on('error', err => {
      this.emit('error', err)
    })

    socket.listen({ port, ipv6Only: ipv6, hostname: bindAddress }, () => {
      this.emit('listen')
    })

    return socket
  }

  /** @internal */
  private _onTcpClientConnected (socket: Socket): void {
    // set message
    let loadedMessage: string = ''

    // add socked connection to array
    this._sockets.push(socket)

    // no delay in processing the message
    socket.setNoDelay(true)

    // set encoding
    socket.setEncoding(this._opt.encoding)

    socket.on('data', data => {
      try {
        // set message
        loadedMessage = data.toString().replace(VT, '')

        // is there is F5 and CR in this message?
        if (loadedMessage.includes(FS + CR)) {
          // strip them out
          loadedMessage = loadedMessage.replace(FS + CR, '')

          // parser either is batch or a message
          let parser: FileBatch | Batch | Message

          // send raw information to the emit
          this.emit('data.raw', loadedMessage)

          if (isBatch(loadedMessage)) {
            // parser the batch
            parser = new Batch({ text: loadedMessage })
            // load the messages
            const allMessage = parser.messages()
            // loop messages
            allMessage.forEach((message: Message) => {
              const messageParsed = new Message({ text: message.toString() })
              const req = new InboundRequest(messageParsed, { type: 'batch' })
              const res = new SendResponse(socket, message)
              this._handler(req, res)
            })
          } else if (isFile(loadedMessage)) {
            // parser the batch
            parser = new FileBatch({ text: loadedMessage })
            // load the messages
            const allMessage = parser.messages()
            allMessage.forEach((message: Message) => {
              const messageParsed = new Message({ text: message.toString() })
              const req = new InboundRequest(messageParsed, { type: 'file' })
              const res = new SendResponse(socket, message)
              this._handler(req, res)
            })
          } else {
            // parse the message
            const message = new Message({ text: loadedMessage })
            const req = new InboundRequest(message, { type: 'message' })
            const res = new SendResponse(socket, message)
            this._handler(req, res)
          }
        }
      } catch (err) {
        this.emit('data.error', err)
      }
    })

    socket.on('error', err => {
      this.emit('client.error', err)
      this._closeSocket(socket)
    })

    socket.on('close', hadError => {
      this.emit('client.close', hadError)
      this._closeSocket(socket)
    })

    this.emit('client.connect', socket)
  }

  /** @internal */
  private _closeSocket (socket: Socket): void {
    socket.destroy()
    this._sockets.splice(this._sockets.indexOf(socket), 1)
  }
}
