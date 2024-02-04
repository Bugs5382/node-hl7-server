import { Message } from 'node-hl7-client'
import { HL7ListenerError } from '../../utils/exception.js'

/**
 * Inbound Request Props
 * @since 1.0.0
 */
export interface InboundRequestProps {
  type: string
}

/**
 * Inbound Request
 * @since 1.0.0
 */
export class InboundRequest {
  /** @internal */
  private readonly _message?: Message
  /** @internal */
  private readonly _fromType: string

  /**
   * @since 1.0.0
   * @param message
   * @param props
   */
  constructor (message: Message, props: InboundRequestProps) {
    this._fromType = props.type
    this._message = message
  }

  /** '
   * Get Stored Message
   * @since 1.0.0
   */
  getMessage (): Message {
    if (typeof this._message !== 'undefined') {
      return this._message
    }
    throw new HL7ListenerError('Message is not defined.')
  }

  getType (): string {
    return this._fromType
  }
}
