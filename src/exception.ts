/** Low severity */
class HL7ServerError extends Error {
  code: string
  /** @internal */
  constructor(code: string, message: string) {
    super(message)
    this.name = 'HL7ClientError'
    this.code = code
  }
}

/** High severity. All pending actions are rejected and all connections are closed. The connection is reset. */
class HL7ServerConnectionError extends HL7ServerError {
  /** @internal */
  name = 'HL7ServerConnectionError'
}

export {HL7ServerError, HL7ServerConnectionError}