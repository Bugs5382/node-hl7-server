import { ISendRequest } from "@/declaration/ISendRequest";
import { MLLPCodec } from "@/utils/codec";
import {
  MSA_1_VALUES_v2_1,
  MSA_1_VALUES_v2_x,
  validMSA1,
} from "@/utils/constants";
import { HL7ServerError } from "@/utils/exception";
import { ListenerOptions } from "@/utils/normalize";
import { Socket } from "net";
import { Message } from "node-hl7-client";
import EventEmitter from "node:events";

/**
 * base Send Response
 * @since 4.0.0
 */
export class BaseSendResponse extends EventEmitter implements ISendRequest {
  /** @internal */
  protected _ack: Message | undefined;
  /** @internal */
  protected readonly _socket: Socket;
  /** @internal */
  protected readonly _message: Message;
  /** @internal */
  protected readonly _mshOverrides: ListenerOptions["mshOverrides"];
  /** @internal */
  protected readonly _codec: MLLPCodec;

  constructor(
    socket: Socket,
    message: Message,
    mshOverrides?: ListenerOptions["mshOverrides"],
  ) {
    super();
    this._ack = undefined;
    this._message = message;
    this._mshOverrides = mshOverrides;
    this._socket = socket;
    this._codec = new MLLPCodec();
  }

  /**
   * Get the Ack Message
   * @since 2.2.0
   * @remarks Get the acknowledged message that was sent to the client.
   * This could return undefined if accessed before sending the response
   */
  getAckMessage(): Message | undefined {
    return this._ack;
  }

  /**
   * Use the codec attached the to send request so you can send your custom message. You need to provide the client socket (@see getSocket())
   * that you will need, the HL7 Message object as a string, and the encoding format you want.
   *
   * @example
   *
   * this._codec.sendMessage(socket, this.message.toString(), "utf-8");
   *
   */
  getCodec() {
    return this._codec;
  }

  /**
   * Get the socket used from the client which can be used to send a message back,
   * however, you should always use the Codec class (@see getCodec()) as it can handle
   * long messages to encode the message in a way that a remote side can
   * understand.
   * @since 4.0.0
   * @return Socket
   */
  getSocket() {
    return this._socket;
  }

  async sendResponse(_type: validMSA1, _encoding: BufferEncoding) {
    throw new Error("Method not implemented.");
  }

  /** @internal */
  protected _validateMSA1(spec: string, type: validMSA1): void {
    switch (spec) {
      case "2.1":
        if (!MSA_1_VALUES_v2_1.includes(type)) {
          throw new HL7ServerError(
            `Invalid MSA.1 value: ${type} for HL7 version 2.1`,
          );
        }
        break;
      default:
        if (![...MSA_1_VALUES_v2_1, ...MSA_1_VALUES_v2_x].includes(type)) {
          throw new HL7ServerError(
            `Invalid MSA.1 value: ${type} for HL7 version ${spec}`,
          );
        }
        break;
    }
  }
}
