import EventEmitter from "events";
import {Socket} from "net";
import * as net from "net";
import {CR, VT, FS} from "./constants";
import normalizeOptions, {ServerOptions} from "./normalize.js";

class Res {
  /** @internal */
  _ack: any;
  /** @internal */
  _end: () => void
  /** @internal */
  _socket: Socket;

  constructor(socket: Socket, ack: any) {
    this._ack = ack;
    this._socket = socket;
    this._end = function () {
      socket.write(VT + (this._ack).toString() + FS + CR);
    };
  }

}

class Req {

  _msg: string;
  // @ts-ignore
  _parsed: string;

  _type: any;
  _event: any;

  constructor(msg: any) {
    //  parse the raw message (msg)
    // @ts-ignore
    let hl7;
    try {
      // hl7 = new Parser(msg)
      // hl7.transform();
    } catch (err) {
      if (err) throw err;
    }
    this._msg = msg;
    /*
    this._type = hl7.get('MSH.9.1');
    this._event = hl7.get('MSH.9.2');
    this._parsed = hl7.transformed;
    */
  }

}

export class Server extends EventEmitter {
  /** @internal */
  _opt: ReturnType<typeof normalizeOptions>
  /** @internal */
  _sockets: Socket[]
  /** @internal */
  _server: net.Server
  /** @internal */
  _connected: boolean
  /** @internal */
  _handler: any;

  constructor() {
    super();

    this._listen = this._listen.bind(this)
    this._onTcpClientConnected = this._onTcpClientConnected.bind(this)

    this._opt = normalizeOptions()

    this._connected = false;
    this._sockets = []
    this._handler = ''

    this._server = this._listen()

  }

  /** This creates an instance of a HL7 server.
   * @since 1.0.0 */
  async create(props?: ServerOptions) {
    this._opt = normalizeOptions(props)
  }

  /** This starts the instance of the HL7 server on the particular port.
   * @since 1.0.0 */
  async listen() {

  }

  /** This creates an instance of a HL7 server.
   * @since 1.0.0 */
  async close() {

  }

  /** @internal */
  private _listen() {

    const server = net.createServer(socket => this._onTcpClientConnected(socket, this._opt.encoding))

    server.on('connection', socket => {
      this.emit('connection', socket);
    });

    server.on('error', err => {
      this.emit('error', err);
    });

    server.listen({port: this._opt.port, hostname: this._opt.bindAddress}, () => {
      this._connected = true
    })

    return server

  }

  /** @internal */
  private _onTcpClientConnected(socket: Socket, encoding: BufferEncoding) {
    // add socked connection to array
    this._sockets.push(socket)

    // no delay in processing the message
    socket.setNoDelay(true)

    // force the message to be nothing to start
    let message: string = ''

    socket.on('data', (data: any) => {
      try {
        message += data.toString();
        if (message.substring(message.length - 2, message.length) === FS + CR) {
          let cleanHL7 = message.substring(1, message.length - 2);
          let ack = this._createAckMessage(cleanHL7);
          let req = new Req(cleanHL7);
          let res = new Res(socket, ack);
          this._handler(null, req, res);
          message = '';
        }
      } catch (err) {
        this.emit('data.error', err)
      }
    }).setEncoding(encoding)

    socket.on('error', err => {
      this.emit('client.error', err)
      this._closeSocket(socket);
    });

    // eslint-disable-next-line no-unused-vars
    socket.on('close', hadError => {
      this.emit('client.cloe', hadError)
      this._closeSocket(socket);
    });

    this.emit('client.connect', socket);

  }

  /** @internal */
  private _createAckMessage(cleanHL7: string) {


    return cleanHL7

  }

  /** @internal */
  private _closeSocket(socket: Socket) {
    socket.destroy();
    this._sockets.splice(this._sockets.indexOf(socket), 1);
  }
}