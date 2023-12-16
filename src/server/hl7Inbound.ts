import EventEmitter from 'events'
import net, { Socket } from 'net'
import tls from 'tls'
import { Batch, Message, isBatch, isFile, createHL7Date } from 'node-hl7-client'
import { ListenerOptions, normalizeListenerOptions } from '../utils/normalize.js'
import { InboundRequest } from './modules/inboundRequest.js'
import { Parser } from './modules/parser.js'
import { SendResponse } from './modules/sendResponse.js'
import { Server } from './server.js'

/**
 * Inbound Handler
 * @description The handler that will handle the user parsing a received message by the client to the server.
 * @since 1.0.0
 * @example
 * In this example, we are processing the results in an async handler.
 *
 *  const IB_ADT = server.createInbound({port: 3000}, async (req, res) => {
 *    const messageReq = req.getMessage()
 *    const messageRes = res.getAckMessage()
 *  })
 *
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
      const {key, cert, requestCert, ca} = this._main._opt.tls
      socket = tls.createServer({key, cert, requestCert, ca},socket => this._onTcpClientConnected(socket))
    } else {
      socket = net.createServer(socket => this._onTcpClientConnected(socket))
    }

    socket.on('error', err => {
      this.emit('error', err)
    })

    socket.listen({ port, ipv6Only: ipv6, hostname: bindAddress }, () => {

    })

    return socket
  }

  /** @internal */
  private _onTcpClientConnected (socket: Socket): void {
    // set message
    let message: string = ''

    // add socked connection to array
    this._sockets.push(socket)

    // no delay in processing the message
    socket.setNoDelay(true)

    // set encoding
    socket.setEncoding(this._opt.encoding)

    // custom parser
    const parser = new Parser()

    // process sock though custom parser
    socket.pipe(parser)

    parser.on('data', data => {
      try {
        // parser either is batch or a message
        let parser: Batch | Message
        // set message
        message = data.toString()
        if (isBatch(message)) {
          // parser the batch
          parser = new Batch({ text: message })
          // load the messages
          const allMessage = parser.messages()
          // loop messages
          allMessage.forEach((message: Message) => {
            const messageParsed = new Message({ text: message.toString() })
            const req = new InboundRequest(messageParsed)
            const res = new SendResponse(socket, this._createAckMessage(message))
            this._handler(req, res)
          })
        } else if (isFile(data.toString())) {
          // * noop, not created yet * //
        } else {
          // parse the message
          const parser = new Message({ text: message })
          // request
          const req = new InboundRequest(parser)
          // response
          const res = new SendResponse(socket, this._createAckMessage(parser))
          this._handler(req, res)
        }
      } catch (err) {
        this.emit('data.error', err)
      }
    })

    parser.on('error', err => {
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
  private _createAckMessage (message: Message): Message {
    const ackMessage = new Message({
      messageHeader: {
        msh_9_1: 'ACK',
        msh_9_2: message.get('MSH.9.2').toString(),
        msh_10: `ACK${createHL7Date(new Date())}`
      }
    })

    ackMessage.set('MSH.3', message.get('MSH.5').toRaw())
    ackMessage.set('MSH.4', message.get('MSH.6').toRaw())
    ackMessage.set('MSH.5', message.get('MSH.3').toRaw())
    ackMessage.set('MSH.6', message.get('MSH.4').toRaw())
    ackMessage.set('MSH.11', message.get('MSH.11').toRaw())

    const segment = ackMessage.addSegment('MSA')
    segment.set('1', 'AA')
    segment.set('2', message.get('MSH.10').toString())

    return ackMessage
  }

  /** @internal */
  private _closeSocket (socket: Socket): void {
    socket.destroy()
    this._sockets.splice(this._sockets.indexOf(socket), 1)
  }
}
