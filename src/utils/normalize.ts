import {
  assertNumber,
  Message,
  randomString,
  validIPv4,
  validIPv6,
} from "node-hl7-client";
import { TcpSocketConnectOpts } from "node:net";
import type { ConnectionOptions as TLSOptions } from "node:tls";
import { HL7ListenerError, HL7ServerError } from "./exception";

const DEFAULT_SERVER_OPTS: Partial<ServerOptions> = {
  bindAddress: "0.0.0.0",
  encoding: "utf-8",
  ipv4: true,
  ipv6: false,
};

const DEFAULT_LISTENER_OPTS: Partial<ListenerOptions> = {
  encoding: "utf-8",
};

/**
 * @since 1.0.0
 */
export interface ServerOptions {
  /** The network address to listen on expediently.
   * @default 0.0.0.0 */
  bindAddress?: string;
  /** Encoding of the messages we expect from the HL7 message.
   * @default "utf-8"
   */
  encoding?: BufferEncoding;
  /** IPv4 Only - If this is set to true, only IPv4 address will be used.
   * @default false */
  ipv4?: boolean;
  /** IPv6 Only - If this is set to true, only IPv6 address will be used.
   * @default false */
  ipv6?: boolean;
  /** Additional options when creating the TCP socket with net.connect(). */
  socket?: TcpSocketConnectOpts;
  /** Enable TLS, or set TLS specific options like overriding the CA for
   * self-signed certificates. */
  tls?: TLSOptions;
}

/**
 * @since 1.0.0
 */
export interface ListenerOptions {
  /** Encoding of the messages we expect from the HL7 message.
   * @default "utf-8"
   */
  encoding?: BufferEncoding;
  /** Optional MSH segment overrides. See the readme for examples.
   * @since 2.5.0 */
  mshOverrides?: Record<string, string | ((message: Message) => string)>;
  /** Name of the Listener (e.g., IB_EPIC_ADT)
   * @default Randomized String */
  name?: string;
  /** The network address to listen on expediently.
   * Must be set between 0 and 65353 */
  port: number;
}

/**
 * @since 1.0.0
 */
type ValidatedKeys = "port";

/**
 * @since 1.0.0
 */
interface ValidatedOptions
  extends Pick<Required<ListenerOptions>, ValidatedKeys> {
  mshOverrides?: Record<string, string | ((message: Message) => string)>;
  name?: string;
  port: number;
}

/** @internal */
export function normalizeServerOptions(props?: ServerOptions): ServerOptions {
  const merged: ServerOptions = {
    ...DEFAULT_SERVER_OPTS,
    ...(props || {}),
  };

  if (merged.ipv4 === true && merged.ipv6 === true) {
    throw new HL7ServerError(
      "ipv4 and ipv6 both can't be set to be exclusive.",
    );
  }

  if (typeof merged.bindAddress !== "string") {
    throw new HL7ServerError("bindAddress is not valid string.");
  } else if (merged.bindAddress !== "localhost") {
    if (
      typeof merged.bindAddress !== "undefined" &&
      merged.ipv6 === true &&
      !validIPv6(merged.bindAddress)
    ) {
      throw new HL7ServerError("bindAddress is an invalid ipv6 address.");
    }

    if (
      typeof merged.bindAddress !== "undefined" &&
      merged.ipv4 === true &&
      !validIPv4(merged.bindAddress)
    ) {
      throw new HL7ServerError("bindAddress is an invalid ipv4 address.");
    }
  }

  return merged;
}

/** @internal */
export function normalizeListenerOptions(
  props: ListenerOptions,
): ValidatedOptions {
  const merged: ListenerOptions = {
    ...DEFAULT_LISTENER_OPTS,
    ...(props || {}),
  };

  const nameFormat = /[ `!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?~]/; //eslint-disable-line

  if (typeof merged.name === "undefined") {
    merged.name = randomString();
  } else {
    if (nameFormat.test(merged.name)) {
      throw new HL7ListenerError(
        "name must not contain certain characters: `!@#$%^&*()+\\-=\\[\\]{};':\"\\\\|,.<>\\/?~.",
      );
    }
  }

  if (typeof merged.mshOverrides === "object") {
    Object.entries(merged.mshOverrides).forEach(([_path, override]) => {
      if (typeof override !== "string" && typeof override !== "function") {
        throw new HL7ListenerError(
          "mshOverrides override value must be a string or a function.",
        );
      }
    });
  }

  if (typeof merged.port === "undefined") {
    throw new HL7ListenerError("port is not defined.");
  }

  if (typeof merged.port !== "number" || isNaN(merged.port)) {
    throw new HL7ListenerError("port is not a valid number.");
  }

  assertNumber({ port: merged.port }, "port", 0, 65353);

  return merged;
}
