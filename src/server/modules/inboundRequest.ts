import { Batch, isBatch, isFile, Message } from '../../../../node-hl7-client/src'
import { HL7ListenerError } from '../../utils/exception'

/**
 * Inbound Request
 * @since 1.0.0
 */
export class InboundRequest {
  /** @internal */
  private readonly _isBatch: boolean
  /** @internal */
  private readonly _isFile: boolean
  /** @internal */
  private readonly _message?: Message | Message[]

  constructor (data: any) {
    this._isFile = false
    this._isBatch = false

    let parser: Batch | Message
    if (isBatch(data)) {
      // set request as a batch
      this._isBatch = true
      // parser the batch
      parser = new Batch({ text: data })
      // load the messages
      this._message = parser.messages()
    } else if (isFile(data)) {
      // * noop, not created yet * //
    } else {
      // parse the message load the message for use
      this._message = new Message({ text: data })
    }
  }

  getMessage (): Message {
    if (typeof this._message !== 'undefined') {
      return this._message as Message
    }
    throw new HL7ListenerError(500, 'Message is not defined.')
  }

  getMessages (): Message[] {
    if (typeof this._message !== 'undefined') {
      return this._message as Message[]
    }
    throw new HL7ListenerError(500, 'Message is not defined.')
  }

  isFile (): boolean {
    return this._isFile
  }

  isBatch (): boolean {
    return this._isBatch
  }

  isMessage (): boolean {
    return !this._isBatch && !this._isFile
  }
}
