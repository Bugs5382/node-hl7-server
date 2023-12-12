import { Message } from '../../../../node-hl7-client/src'
import { HL7ListenerError } from '../../utils/exception'

/**
 * Inbound Request
 * @since 1.0.0
 */
export class InboundRequest {
  /** @internal */
  private readonly _message?: Message

  /**
   * @since 1.0.0
   * @param data
   */
  constructor (data: Message) {
      this._message = data
  }

  /**'
   * Get Stored Message
   * @since 1.0.0
   */
  getMessage (): Message {
    if (typeof this._message !== 'undefined') {
      return this._message as Message
    }
    throw new HL7ListenerError(500, 'Message is not defined.')
  }

}
