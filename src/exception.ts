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
class HL7ServerError extends HL7Error {
  /** @internal */
  name = 'HL7ServerError'
}

/** Listener Error */
class HL7ListenerError extends HL7Error {
  /** @internal */
  name = 'HL7ListenerError'
}

export { HL7ListenerError, HL7ServerError, HL7Error }
