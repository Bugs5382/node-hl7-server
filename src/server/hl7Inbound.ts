import EventEmitter from 'events'
import net, { Socket } from 'net'
import tls from 'tls'
import {Batch, Message, isBatch, isFile, createHL7Date} from "../../../node-hl7-client/src";
import { ListenerOptions, normalizeListenerOptions } from '../utils/normalize.js'
import { InboundRequest } from './modules/inboundRequest'
import {Parser} from "./modules/parser";
import { SendResponse } from './modules/sendResponse'
import { Server } from './server'

export type InboundHandler = (req: InboundRequest, res: SendResponse) => Promise<void>

/**
 * Listener Class
 * @since 1.0.0
 */
export class Hl7Inbound extends EventEmitter {
  /** @internal */
  private readonly _handler: (req: InboundRequest, res: SendResponse) => void
  /** @internal */
  _main: Server
  /** @internal */
  _opt: ReturnType<typeof normalizeListenerOptions>
  /** @internal */
  private readonly _server: net.Server | tls.Server
  /** @internal */
  private readonly _sockets: Socket[]

  constructor (server: Server, props: ListenerOptions, handler: InboundHandler) {
    super()
    this._handler = handler
    this._main = server
    this._opt = normalizeListenerOptions(props)
    this._sockets = []

    this._listen = this._listen.bind(this)
    this._onTcpClientConnected = this._onTcpClientConnected.bind(this)
    this._server = this._listen()
  }

  /** Close Listener Instance.
   * This be called for each listener, but if the server instance is closed shut down, this will also fire off.
   * @since 1.0.0 */
  async close (): Promise<boolean> {
    this._sockets.forEach((socket) => {
      socket.destroy()
    })

    this._server?.close(() => {
      this._server?.unref()
    })

    return true
  }

  /** @internal */
  private _listen (): net.Server | tls.Server {
    const port = this._opt.port
    const bindAddress = this._main._opt.bindAddress
    const ipv6 = this._main._opt.ipv6

    const server = net.createServer(socket => this._onTcpClientConnected(socket))

    server.on('error', err => {
      this.emit('error', err)
    })

    server.listen({ port, ipv6Only: ipv6, hostname: bindAddress }, () => {

    })

    return server
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
    const parser = new Parser();

    // process sock though custom parser
    socket.pipe(parser);

    parser.on('data', data => {
      try {
        // parser either is batch or a message
        let parser: Batch | Message
        // set message
        message += data.toString()
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

    // eslint-disable-next-line no-unused-vars
    socket.on('close', hadError => {
      this.emit('client.close', hadError)
      this._closeSocket(socket)
    })

    this.emit('client.connect', socket)
  }


  /** @internal */
  private _createAckMessage (message: Message): Message {

    let ackMessage = new Message({
      messageHeader: {
        msh_9: {
          msh_9_1: `ACK`,
          msh_9_2: message.get('MSH.9.2').toString()
        },
        msh_10: `ACK${createHL7Date(new Date())}`
      }
    })

    ackMessage.set("MSH.3", message.get('MSH.5').toRaw());
    ackMessage.set("MSH.4", message.get('MSH.6').toRaw());
    ackMessage.set("MSH.5", message.get('MSH.3').toRaw());
    ackMessage.set("MSH.6", message.get('MSH.4').toRaw());
    ackMessage.set("MSH.11", message.get('MSH.11').toRaw())

    let segment = ackMessage.addSegment('MSA')

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
