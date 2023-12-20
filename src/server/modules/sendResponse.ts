import { Socket } from 'net'
import { createHL7Date, Message, randomString } from 'node-hl7-client'
import { CR, FS, VT } from '../../utils/constants'

/**
 * Send Response
 * @since 1.0.0
 */
export class SendResponse {
  /** @internal */
  private _ack: Message | undefined
  /** @internal */
  private readonly _socket: Socket
  /** @internal */
  private readonly _message: Message
  /** @internal */
  private _ackSent: boolean

  constructor (socket: Socket, message: Message) {
    this._ack = undefined
    this._ackSent = false
    this._message = message
    this._socket = socket
  }

  /**
   * Send Response back to End User
   * @since 1.0.0
   * @see {@link https://hl7-definition.caristix.com/v2/HL7v2.1/Tables/0008}
   * @param type
   * @example
   * If you are to confirm to the end user (client) that the message they sent was good and processed successfully.
   * you would send an "AA" style message (Application Accept).
   * Otherwise, send an "AR" (Application Reject) to tell the client the data was
   * no accept.ed/processed.
   * ```
   * const server = new Server({bindAddress: '0.0.0.0'})
   * const IB_ADT = server.createInbound({port: LISTEN_PORT}, async (req, res) => {
   *  const messageReq = req.getMessage()
   *  await res.sendResponse("AA")
   * })
   * ```
   * "AE" (Application Error) will be sent if there is a problem creating either an "AA" or "AR" message from the orginial message sent.
   */
  async sendResponse (type: 'AA' | 'AR'): Promise<boolean> {
    try {
      this._ack = this._createAckMessage(type, this._message)
      this._socket.write(Buffer.from(`${VT}${this._ack.toString()}${FS}${CR}`))
    } catch (_e: any) {
      this._ack = this._createAEAckMessage()
      this._socket.write(Buffer.from(`${VT}${this._ack.toString()}${FS}${CR}`))
    }

    this._ackSent = true

    return this._ackSent
  }

  /** @internal */
  private _createAckMessage (type: string, message: Message): Message {
    const ackMessage = new Message({
      messageHeader: {
        msh_9_1: 'ACK',
        msh_9_2: message.get('MSH.9.2').toString(),
        msh_10: `ACK${createHL7Date(new Date())}`,
        msh_11_1: message.get('MSH.11.1').toString() as "P" | "D" | "T"
      }
    })

    ackMessage.set('MSH.3', message.get('MSH.5').toRaw())
    ackMessage.set('MSH.4', message.get('MSH.6').toRaw())
    ackMessage.set('MSH.5', message.get('MSH.3').toRaw())
    ackMessage.set('MSH.6', message.get('MSH.4').toRaw())
    ackMessage.set('MSH.11', message.get('MSH.11').toRaw())
    ackMessage.set('MSH.12', message.get('MSH.12').toRaw())

    const segment = ackMessage.addSegment('MSA')
    segment.set('1', type)
    segment.set('2', message.get('MSH.10').toString())

    return ackMessage
  }

  /** @internal */
  private _createAEAckMessage (): Message {
    const ackMessage = new Message({
      messageHeader: {
        msh_9_1: 'ACK',
        msh_9_2: '',
        msh_10: `ACK${createHL7Date(new Date())}`,
        msh_11_1: "P"
      }
    })

    ackMessage.set('MSH.3', '') // This would need to be set by the application. Maybe from the server class?
    ackMessage.set('MSH.4', '') // This would need to be set by the application. Maybe from the server class?

    const segment = ackMessage.addSegment('MSA')
    segment.set('1', 'AE')
    segment.set('2', randomString())

    return ackMessage
  }
}
