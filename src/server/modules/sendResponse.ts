import { Socket } from 'net'

/**
 * Listener Response
 * @since 1.0.0
 */
export class SendResponse {
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
      socket.write(Buffer.from('This is a test.'))
    }
  }
}
