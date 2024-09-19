import { TcpSocketConnectOpts } from 'node:net'
import type { ConnectionOptions as TLSOptions } from 'node:tls'
import { assertNumber, randomString, validIPv4, validIPv6 } from 'node-hl7-client'
import { HL7ListenerError, HL7ServerError } from './exception.js'

const DEFAULT_SERVER_OPTS = {
  bindAddress: '0.0.0.0',
  encoding: 'utf-8',
  ipv4: true,
  ipv6: false
}

const DEFAULT_LISTENER_OPTS = {
  encoding: 'utf-8'
}

/**
 * @since 1.0.0
 */
export interface ServerOptions {
  /** The network address to listen on expediently.
   * @default 0.0.0.0 */
  bindAddress?: string
  /** IPv4 Only - If this is set to true, only IPv4 address will be used.
   * @default false */
  ipv4?: boolean
  /** IPv6 Only - If this is set to true, only IPv6 address will be used.
   * @default false */
  ipv6?: boolean
  /** Additional options when creating the TCP socket with net.connect(). */
  socket?: TcpSocketConnectOpts
  /** Enable TLS, or set TLS specific options like overriding the CA for
   * self-signed certificates. */
  tls?: TLSOptions
}

/**
 * @since 1.0.0
 */
export interface ListenerOptions {
  /** Optional MSH segment overrides
   * syntax: [field path as numbers separated by dots]: [field value]
   * e.g. { '9.3': 'ACK' } --> MSH field 9.3 set to "ACK"
   * @since 2.5.0 */
  mshOverrides?: Record<string, string>
  /** Name of the Listener (e.g., IB_EPIC_ADT)
   * @default Randomized String */
  name?: string
  /** The network address to listen on expediently.
   * Must be set between 0 and 65353 */
  port: number
  /** Encoding of the messages we expect from the HL7 message.
   * @default "utf-8"
   */
  encoding?: BufferEncoding
}

/**
 * @since 1.0.0
 */
type ValidatedKeys =
    | 'name'
    | 'port'
    | 'encoding'

/**
 * @since 1.0.0
 */
interface ValidatedOptions extends Pick<Required<ListenerOptions>, ValidatedKeys> {
  mshOverrides?: Record<string, string>
  name: string
  port: number
}

/** @internal */
export function normalizeServerOptions (raw?: ServerOptions): ServerOptions {
  const props: any = { ...DEFAULT_SERVER_OPTS, ...raw }

  if (props.ipv4 === true && props.ipv6 === true) {
    throw new HL7ServerError('ipv4 and ipv6 both can\'t be set to be exclusive.')
  }

  if (typeof props.bindAddress !== 'string') {
    throw new HL7ServerError('bindAddress is not valid string.')
  } else if (props.bindAddress !== 'localhost') {
    if (typeof props.bindAddress !== 'undefined' && props.ipv6 === true && !validIPv6(props.bindAddress)) {
      throw new HL7ServerError('bindAddress is an invalid ipv6 address.')
    }

    if (typeof props.bindAddress !== 'undefined' && props.ipv4 === true && !validIPv4(props.bindAddress)) {
      throw new HL7ServerError('bindAddress is an invalid ipv4 address.')
    }
  }

  return props
}

/** @internal */
export function normalizeListenerOptions (raw?: ListenerOptions): ValidatedOptions {
  const props: any = { ...DEFAULT_LISTENER_OPTS, ...raw }

  const nameFormat = /[ `!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?~]/ //eslint-disable-line

  if (typeof props.name === 'undefined') {
    props.name = randomString()
  } else {
    if (nameFormat.test(props.name)) {
      throw new HL7ListenerError('name must not contain certain characters: `!@#$%^&*()+\\-=\\[\\]{};\':"\\\\|,.<>\\/?~.')
    }
  }

  if (typeof props.port === 'undefined') {
    throw new HL7ListenerError('port is not defined.')
  }

  if (typeof props.port !== 'number') {
    throw new HL7ListenerError('port is not valid number.')
  }

  assertNumber(props, 'port', 0, 65353)

  return props
}
