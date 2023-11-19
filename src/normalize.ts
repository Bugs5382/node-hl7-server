import { TcpSocketConnectOpts } from 'node:net'
import type { ConnectionOptions as TLSOptions } from 'node:tls'

const DEFAULT_SERVER_OPTS = {
  bindAddress: '0.0.0.0',
  encoding: 'utf-8',
  ipv4: false,
  ipv6: false
}

const DEFAULT_LISTENER_OPTS = {
  encoding: 'utf-8'
}

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
  tls?: boolean | TLSOptions
}

export interface ListenerOptions {
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

type ValidatedKeys =
  | 'name'
  | 'port'
  | 'encoding'

interface ValidatedOptions extends Pick<Required<ListenerOptions>, ValidatedKeys> {
  name: string
  port: number
}

/** @internal */
export function normalizeServerOptions (raw?: ServerOptions): ServerOptions {
  const props: any = { ...DEFAULT_SERVER_OPTS, ...raw }

  if (props.ipv4 && props.ipv6) {
    throw new Error('ipv4 and ipv6 both can\'t be set to be exclusive.')
  }

  if (typeof props.bindAddress !== 'string') {
    throw new Error('bindAddress is not valid string.')
  }

  if (typeof props.bindAddress !== 'undefined' && props.ipv6 && !validIPv6(props.bindAddress)) {
    throw new Error('bindAddress is an invalid ipv6 address.')
  }

  if (typeof props.bindAddress !== 'undefined' && !props.ipv6 && !validIPv4(props.bindAddress)) {
    throw new Error('bindAddress is an invalid ipv4 address.')
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
      throw new Error(`name must not contain these characters: ${nameFormat}`)
    }
  }

  if (typeof props.port === 'undefined') {
    throw new Error('port is not defined.')
  }

  if (typeof props.port !== 'number') {
    throw new Error('port is not valid number.')
  }

  assertNumber(props, 'port', 0, 65353)

  return props
}

function assertNumber (props: Record<string, number>, name: string, min: number, max?: number): void {
  const val = props[name]
  if (isNaN(val) || !Number.isFinite(val) || val < min || (max != null && val > max)) {
    throw new TypeError(max != null
      ? `${name} must be a number (${min}, ${max}).`
      : `${name} must be a number >= ${min}.`)
  }
}

function randomString (length = 20): string {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_'
  const charactersLength = characters.length
  let counter = 0
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
    counter += 1
  }
  return result
}

/** @internal */
function validIPv4 (ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  if (ipv4Regex.test(ip)) {
    return ip.split('.').every(part => parseInt(part) <= 255)
  }
  return false
}

/** @internal */
function validIPv6 (ip: string): boolean {
  const ipv6Regex = /^([\da-f]{1,4}:){7}[\da-f]{1,4}$/i
  if (ipv6Regex.test(ip)) {
    return ip.split(':').every(part => part.length <= 4)
  }
  return false
}
