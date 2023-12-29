import EventEmitter from 'events'
import { HL7Inbound, InboundHandler } from './HL7Inbound.js'
import { ServerOptions, normalizeServerOptions, ListenerOptions } from '../utils/normalize.js'

/**
 * Server Class
 * @description Start Server listening on a network address.
 * {@link ServerOptions} Link to the options that can be passed into props.
 * @since 1.0.0
 * @extends EventEmitter
 */
export class Server extends EventEmitter {
  /** @internal */
  _opt: ReturnType<typeof normalizeServerOptions>

  /**
   * @since 1.0.0
   * @param props {@link ServerOptions}
   * @example
   *
   * Non-TLS:
   * ```
   * const server = new Server()
   * ```
   *
   * TLS:
   * ```
   * const server = new Server(
   *   {
   *     tls:
   *       {
   *         key: fs.readFileSync(path.join('certs/', 'server-key.pem')), // where your certs are
   *         cert: fs.readFileSync(path.join('certs/', 'server-crt.pem')), // where your certs are
   *         rejectUnauthorized: false
   *       }
   *   })
   *   ```
   *
   */
  constructor (props?: ServerOptions) {
    super()
    this._opt = normalizeServerOptions(props)
  }

  /** This creates an instance of a HL7 server.
   * @description You would specify your port and what it will do when it gets a message.
   * @since 1.0.0
   * @example
   *```
   * const server = new Server()
   *
   * const IB = server.createInbound({port: 3000}, async (req, res) => {
   *   const messageReq = req.getMessage()
   *   const messageRes = res.getAckMessage()
   *   // do your code here
   * })
   *```
   *
   * */
  createInbound (props: ListenerOptions, cb: InboundHandler): HL7Inbound {
    return new HL7Inbound(this, props, cb)
  }
}
