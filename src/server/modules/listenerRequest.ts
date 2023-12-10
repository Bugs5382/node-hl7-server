import { Batch, isBatch, isFile, Message } from '../../../../node-hl7-client/src'

/**
 * Listener Request
 * @since 1.0.0
 */
export class ListenerRequest {
  /** @internal */
  _isBatch: boolean
  /** @internal */
  _isFile: boolean
  /** @internal */
  _message: Message | Message[] | undefined

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
}
