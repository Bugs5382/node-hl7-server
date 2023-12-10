import EventEmitter from 'events'
import net, { Socket } from 'net'
import tls from 'tls'
import { ListenerOptions, normalizeListenerOptions } from '../utils/normalize.js'
import { InboundRequest } from './modules/inboundRequest'
import { SendResponse } from './modules/sendResponse'
import { Server } from './server'

export type InboundHandler = (req: InboundRequest, res: SendResponse) => Promise<void>

/**
 * Listener Class
 * @since 1.0.0
 */
export class Hl7Inbound extends EventEmitter {
  /** @internal */
  _main: Server
  /** @internal */
  _opt: ReturnType<typeof normalizeListenerOptions>
  /** @internal */
  private readonly _server: net.Server | tls.Server
  /** @internal */
  private readonly _sockets: Socket[]
  /** @internal */
  private readonly _handler: (req: InboundRequest, res: SendResponse) => void

  constructor (server: Server, props: ListenerOptions, handler: InboundHandler) {
    super()

    this._main = server

    // process listener options
    this._opt = normalizeListenerOptions(props)

    this._sockets = []

    this._handler = handler

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
    // add socked connection to array
    this._sockets.push(socket)

    // no delay in processing the message
    socket.setNoDelay(true)

    // set encoding
    socket.setEncoding(this._opt.encoding)

    socket.on('error', () => {
      this._closeSocket(socket)
    })

    socket.on('data', data => {
      try {
        const cleanHL7 = data.toString()
        // const ack = this._createAckMessage(cleanHL7)
        const req = new InboundRequest(cleanHL7)
        const res = new SendResponse(socket, 'test')
        this._handler(req, res)
      } catch (err) {
        this.emit('data.error', err)
      }
    })

    socket.on('error', err => {
      this.emit('client.error', err)
      this._closeSocket(socket)
    })

    // eslint-disable-next-line no-unused-vars
    socket.on('close', hadError => {
      this.emit('client.close', hadError)
      this._closeSocket(socket)
    })

    socket.pipe(socket)

    this.emit('client.connect', socket)
  }

  /*  // @ts-ignore
  // @ts-ignore
  /!** @internal *!/
  private _createAckMessage (cleanHL7: string): string {
    return cleanHL7
  } */

  /** @internal */
  private _closeSocket (socket: Socket): void {
    socket.destroy()
    this._sockets.splice(this._sockets.indexOf(socket), 1)
  }
}
