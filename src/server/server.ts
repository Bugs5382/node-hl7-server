import EventEmitter from 'events'
import { Listener, ListenerHandler } from './listener.js'
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
  createListener (props: ListenerOptions, cb: ListenerHandler): Listener {
    return new Listener(this, props, cb)
  }
}
