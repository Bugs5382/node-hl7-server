import { Socket } from 'net'
import { CR, FS, VT } from '../../utils/constants.js'

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
