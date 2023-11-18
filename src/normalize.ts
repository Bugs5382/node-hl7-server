import {TcpSocketConnectOpts} from 'node:net'
import type {ConnectionOptions as TLSOptions} from 'node:tls'

const DEFAULT_OPTS = {
  bindAddress: '0.0.0.0',
  encoding: 'utf-8'
}

export interface ServerOptions {
  /** The network address to listen on expediently.
   * @default 0.0.0.0 */
  bindAddress?: string,

  /** Encoding of the messages we expect from the HL7 message.
   * @default "utf-8"
   */
  encoding?: BufferEncoding,
  /** The port this instance listens on for other HL7 messages to be sent
   * to it.
   * @requires */
  port: number,
  /** Additional options when creating the TCP socket with net.connect(). */
  socket?: TcpSocketConnectOpts,
  /** Enable TLS, or set TLS specific options like overriding the CA for
   * self-signed certificates. */
  tls?: boolean | TLSOptions,
}

type ValidatedKeys =
  | 'bindAddress'
  | 'encoding'
  | 'port'

interface ValidatedOptions extends Pick<Required<ServerOptions>, ValidatedKeys> {
  port: number,
}

/** @internal */
export default function normalizeOptions(raw?: ServerOptions): ValidatedOptions {
  const props: any = {...DEFAULT_OPTS, ...raw}

  if (typeof props.port === 'undefined') {
    throw new Error('port is not defined.')
  }

  if (typeof props.port !== 'number') {
    throw new Error('port is not valid string.')
  }

  if (typeof props.bindAddress !== 'string') {
      throw new Error('url is not valid string.')
  }

  if (props.tls === true) {
    props.tls = {}
  }

  assertNumber(props, 'port', 0, 65353)

  return props
}

function assertNumber(props: Record<string, number>, name: string, min: number, max?: number) {
  const val = props[name]
  if (isNaN(val) || !Number.isFinite(val) || val < min || (max != null && val > max)) {
    throw new TypeError(max != null
      ? `${name} must be a number (${min}, ${max})`
      : `${name} must be a number >= ${min}`)
  }
}