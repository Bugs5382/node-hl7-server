import EventEmitter from "events";
import net from "net";
import {Socket} from "net";
import {CR, FS, VT} from "./constants.js";
import {normalizeListenerOptions, ListenerOptions } from "./normalize.js";
import {Server} from "./server.js";

export interface ListenerHandler {
  (req: Req, res: Res): Promise<void>
}

export class Req {
  _msg: string
  // @ts-expect-error
  _parsed: string

  _type: any
  _event: any

  constructor (msg: any) {
    //  parse the raw message (msg)
    // @ts-expect-error
    let hl7
    try {
      // hl7 = new Parser(msg)
      // hl7.transform();
    } catch (err) {
      if (err) throw err
    }
    this._msg = msg
    /*
    this._type = hl7.get('MSH.9.1');
    this._event = hl7.get('MSH.9.2');
    this._parsed = hl7.transformed;
    */
  }
}

export class Res {
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
      socket.write(`${VT} ${this._ack.toString()}${FS}${CR}`)
    }
  }
}


export class Listener extends EventEmitter {
  /** @internal */
  _main: Server
  /** @internal */
  _opt: ReturnType<typeof normalizeListenerOptions>
  /** @internal */
  _server: net.Server | undefined
  /** @internal */
  _sockets: Socket[]
  /** @internal */
  _connected: boolean // @todo This should be "set" status, "READY" (accepting inbound connections), "NOT READY" (paused or turned off for some reason), "ERROR" (we errored out. Will attempt to re-create, but no returnees..
  /** @internal */
  _handler: any

  constructor(server: Server, props: ListenerOptions, handler: ListenerHandler) {
    super();

    this._main = server

    // process listener options
    this._opt = normalizeListenerOptions(props)

    this._connected = false
    this._sockets = []

    this._handler = handler
  }

  /** This starts the instance of the HL7 server on the particular port.
   * @since 1.0.0 */
  async listen () {
    this._listen = this._listen.bind(this)
    this._onTcpClientConnected = this._onTcpClientConnected.bind(this)
    this._server = this._listen()
  }

  /** @internal */
  private _listen () {
    const encoding = this._opt?.encoding

    const server = net.createServer(socket => this._onTcpClientConnected(socket, encoding))

    server.on('connection', socket => {
      this.emit('connection', socket)
    })

    server.on('error', err => {
      this.emit('error', err)
    })

    server.listen({ port: this._opt.port }, () => {
      this._connected = true
    })

    return server
  }

  /** @internal */
  private _onTcpClientConnected (socket: Socket, encoding: BufferEncoding) {
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
          const req = new Req(cleanHL7)
          const res = new Res(socket, ack)
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
      this.emit('client.cloe', hadError)
      this._closeSocket(socket)
    })

    this.emit('client.connect', socket)
  }

  /** @internal */
  private _createAckMessage (cleanHL7: string) {
    return cleanHL7
  }

  /** @internal */
  private _closeSocket (socket: Socket) {
    socket.destroy()
    this._sockets.splice(this._sockets.indexOf(socket), 1)
  }

}