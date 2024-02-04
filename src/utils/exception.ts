/** Base Error Class
 * @since 1.0.0 */
class HL7Error extends Error {
  /** @internal */
  code: number
  /** @internal */
  constructor (code: number, message: string) {
    super(message)
    this.name = 'HL7ServerError'
    this.code = code
  }
}

/** Server Error
 * @since 1.0.0 */
export class HL7ServerError extends HL7Error {
  /** @internal */
  name = 'HL7ServerError'
  constructor (message: string) {
    super(500, message)
  }
}

/** Listener Error
 * @since 1.0.0 */
export class HL7ListenerError extends Error {
  /** @internal */
  name = 'HL7ListenerError'
}
