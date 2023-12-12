import { Socket } from 'net'
import {Message} from "../../../../node-hl7-client/src";

/**
 * Send Response
 * @since 1.0.0
 */
export class SendResponse {
  /** @internal */
  private readonly _ack: Message

  constructor (socket: Socket, ack: Message) {
    this._ack = ack
    socket.write(Buffer.from(ack.toString()))
  }

  /**
   * Get Ack Message Object
   * @since 1.0.0
   */
  getAckMessage(): Message {
    return this._ack
  }

}
