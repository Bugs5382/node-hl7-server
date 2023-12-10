/** Base Error Class */
class HL7Error extends Error {
  code: string
  /** @internal */
  constructor (code: string, message: string) {
    super(message)
    this.name = 'HL7Error'
    this.code = code
  }
}

/** Server Error */
export class HL7ServerError extends HL7Error {
  /** @internal */
  name = 'HL7ServerError'
}

/** Listener Error */
export class HL7ListenerError extends HL7Error {
  /** @internal */
  name = 'HL7ListenerError'
}
