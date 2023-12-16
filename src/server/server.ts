import EventEmitter from 'events'
import { Hl7Inbound, InboundHandler } from './hl7Inbound.js'
import { ServerOptions, normalizeServerOptions, ListenerOptions } from '../utils/normalize.js'

export class Server extends EventEmitter {
  /** @internal */
  _opt: ReturnType<typeof normalizeServerOptions>

  constructor (props?: ServerOptions) {
    super()
    this._opt = normalizeServerOptions(props)
  }

  /** This creates an instance of a HL7 server.
   * @since 1.0.0 */
  createInbound (props: ListenerOptions, cb: InboundHandler): Hl7Inbound {
    return new Hl7Inbound(this, props, cb)
  }
}
