import EventEmitter from 'events'
import net, { Socket } from 'net'
import tls from 'tls'
import { Batch, isBatch, isFile, Message } from '../../node-hl7-client/src'
import { CR, FS, VT } from './constants.js'
import { normalizeListenerOptions, ListenerOptions } from './normalize.js'
import { Server } from './server.js'

export type ListenerHandler = (req: ListenerRequest, res: ListenerResponse) => Promise<void>

/**
 * Listener Request
 * @since 1.0.0
 */
export class ListenerRequest {
  /** @internal */
  _isBatch: boolean
  /** @internal */
  _isFile: boolean
  /** @internal */
  _message: Message | Message[] | undefined

  constructor (data: any) {
    this._isFile = false
    this._isBatch = false

    let parser: Batch | Message
    if (isBatch(data)) {
      // set request as a batch
      this._isBatch = true
      // parser the batch
      parser = new Batch({ text: data })
      // load the messages
      this._message = parser.messages()
    } else if (isFile(data)) {
      // * noop, not created yet * //
    } else {
      // parse the message load the message for use
      this._message = new Message({ text: data })
    }
  }
}

/**
 * Listener Response
 * @since 1.0.0
 */
export class ListenerResponse {
  /** @internal */
  _ack: any
  /** @internal */
  _end: () => void
  /** @internal */
  _socket: Socket

  constructor (socket: Socket, ack: any) {
    this._ack = ack
    this._socket = socket
    this._end = function () {
      socket.write(`${VT}${this._ack.toString()}${FS}${CR}`)
    }
  }
}

/**
 * Listener Class
 * @since 1.0.0
 */
export class Listener extends EventEmitter {
  /** @internal */
  _main: Server
  /** @internal */
  _opt: ReturnType<typeof normalizeListenerOptions>
  /** @internal */
  _server: net.Server | tls.Server | undefined
  /** @internal */
  _sockets: Socket[]
  /** @internal */
  _connected: boolean
  /** @internal */
  _handler: any

  constructor (server: Server, props: ListenerOptions, handler: ListenerHandler) {
    super()

    this._main = server

    // process listener options
    this._opt = normalizeListenerOptions(props)

    this._connected = false
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
  private _listen (): net.Server {
    const encoding = this._opt?.encoding
    const port = this._opt.port
    const bindAddress = this._main._opt.bindAddress
    const ipv6 = this._main._opt.ipv6

    const server = net.createServer(socket => this._onTcpClientConnected(socket, encoding))

    server.on('connection', socket => {
      this.emit('connection', socket)
    })

    server.on('error', err => {
      this.emit('error', err)
    })

    server.listen({ port, ipv6Only: ipv6, hostname: bindAddress }, () => {
      this._connected = true
    })

    return server
  }

  /** @internal */
  private _onTcpClientConnected (socket: Socket, encoding: BufferEncoding): void {
    // add socked connection to array
    this._sockets.push(socket)

    // no delay in processing the message
    socket.setNoDelay(true)

    // force the message to be nothing to start
    let message: string = ''

    socket.on('data', (data: any) => {
      try {
        message = `${message}${data.toString()}`
        if (message.substring(message.length - 2, message.length) === FS + CR) {
          const cleanHL7 = message.substring(1, message.length - 2)
          const ack = this._createAckMessage(cleanHL7)
          const req = new ListenerRequest(cleanHL7)
          const res = new ListenerResponse(socket, ack)
          this._handler(null, req, res)
          message = ''
        }
      } catch (err) {
        this.emit('data.error', err)
      }
    }).setEncoding(encoding)

    socket.on('error', err => {
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
  private _createAckMessage (cleanHL7: string): string {
    return cleanHL7
  }

  /** @internal */
  private _closeSocket (socket: Socket): void {
    socket.destroy()
    this._sockets.splice(this._sockets.indexOf(socket), 1)
  }
}
