import EventEmitter from "events";
import { Socket } from "net";
import { Message, randomString } from "node-hl7-client";
import {
  HL7_2_1,
  HL7_2_2,
  HL7_2_3,
  HL7_2_3_1,
  HL7_2_4,
  HL7_2_5,
  HL7_2_5_1,
  HL7_2_6,
  HL7_2_7,
  HL7_2_7_1,
  HL7_2_8,
} from "node-hl7-client/hl7";
import type { ListenerOptions } from "../../utils/normalize.js";
import { MLLPCodec } from "../../utils/codec.js";
import { HL7ServerError } from "../../utils/exception.js";
import {
  MSA_1_VALUES_v2_1,
  MSA_1_VALUES_v2_x,
  validMSA1,
} from "../../utils/constants.js";

/**
 * Send Response
 * @since 1.0.0
 */
export class SendResponse extends EventEmitter {
  /** @internal */
  private _ack: Message | undefined;
  /** @internal */
  private readonly _socket: Socket;
  /** @internal */
  private readonly _message: Message;
  /** @internal */
  private readonly _mshOverrides: ListenerOptions["mshOverrides"];
  /** @internal */
  private readonly _codec: MLLPCodec;

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
   * Send Response back to End User
   * @since 1.0.0
   * @see {@link https://hl7-definition.caristix.com/v2/HL7v2.1/Tables/0008}
   * @param type
   * @param encoding
   * @example
   * If you are to confirm to the end user (client) that the message they sent was good and processed successfully.
   * you would send an "AA" style message (Application Accept).
   * Otherwise, send an "AR" (Application Reject) to tell the client the data was
   * not accepted/processed or send an "AE"
   * (Application Error) to tell the client your overall application had an error.
   * ```ts
   * const server = new Server({bindAddress: '0.0.0.0'})
   * const IB_ADT = server.createInbound({port: LISTEN_PORT}, async (req, res) => {
   *  const messageReq = req.getMessage()
   *  await res.sendResponse("AA")
   * })
   *
   * or
   *
   * const server = new Server({bindAddress: '0.0.0.0'})
   * const IB_ADT = server.createInbound({port: LISTEN_PORT}, async (req, res) => {
   *  const messageReq = req.getMessage()
   *  await res.sendResponse("AR")
   * })
   *
   * or
   *
   * const server = new Server({bindAddress: '0.0.0.0'})
   * const IB_ADT = server.createInbound({port: LISTEN_PORT}, async (req, res) => {
   *  const messageReq = req.getMessage()
   *  await res.sendResponse("AE")
   * })
   *```
   *
   * "AE" (Application Error) will be automatically sent if there is a problem creating either an "AA" or "AR"
   * message from the original message sent because the original message structure sent wrong in the first place.
   *
   * If the sepc of the Hl7 message you get from the client, is 2.1, the value sent back can be  "AA", "AR", "AE".
   * Anything above 2.1 and greater fields are valid "AA", "AR", "AE", "CA", "CR", and "CE".
   * If a CE is sent back with 2.1 the system will send an error in which
   * the server will fail to respond proeprlly back to the client.
   *
   */
  async sendResponse(
    type: validMSA1,
    encoding: BufferEncoding = "utf-8",
  ): Promise<void> {
    try {
      this._ack = this._createAckMessage(type, this._message);
    } catch (_e: any) {
      if (_e instanceof HL7ServerError) throw _e;

      this._ack = this._createAEAckMessage();
    }

    this._codec.sendMessage(this._socket, this._ack.toString(), encoding);

    // we are sending a response back, why not?
    this.emit("response.sent");
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

  /** @internal */
  private _createAckMessage(type: validMSA1, message: Message): Message {
    let specClass;
    /** Get spec **/
    const spec = message.get("MSH.12").toString();
    /** Check to see if MSA1 is valid. */
    this._validateMSA1(spec, type);
    /** Get the class. */
    switch (spec) {
      case "2.1":
        specClass = new HL7_2_1();
        break;
      case "2.2":
        specClass = new HL7_2_2();
        break;
      case "2.3":
        specClass = new HL7_2_3();
        break;
      case "2.3.1":
        specClass = new HL7_2_3_1();
        break;
      case "2.4":
        specClass = new HL7_2_4();
        break;
      case "2.5":
        specClass = new HL7_2_5();
        break;
      case "2.5.1":
        specClass = new HL7_2_5_1();
        break;
      case "2.6":
        specClass = new HL7_2_6();
        break;
      case "2.7":
        specClass = new HL7_2_7();
        break;
      case "2.7.1":
        specClass = new HL7_2_7_1();
        break;
      case "2.8":
        specClass = new HL7_2_8();
        break;
    }

    const ackMessage = new Message({
      specification: specClass,
      messageHeader: {
        msh_9_1: "ACK",
        msh_9_2: message.get("MSH.9.2").toString(),
        msh_10: "ACK",
        msh_11_1: message.get("MSH.11.1").toString() as "P" | "D" | "T",
      },
    });

    ackMessage.set("MSH.3", message.get("MSH.5").toString());
    ackMessage.set("MSH.4", message.get("MSH.6").toString());
    ackMessage.set("MSH.5", message.get("MSH.3").toString());
    ackMessage.set("MSH.6", message.get("MSH.4").toString());
    ackMessage.set("MSH.12", message.get("MSH.12").toString());

    // process MSH field overrides if set
    if (typeof this._mshOverrides === "object") {
      Object.entries(this._mshOverrides).forEach(([path, override]) => {
        ackMessage.set(
          `MSH.${path}`,
          typeof override === "function" ? override(message) : override,
        );
      });
    }

    const segment = ackMessage.addSegment("MSA");
    segment.set("1", type);
    segment.set("2", message.get("MSH.10").toString());

    return ackMessage;
  }

  /** @internal */
  private _validateMSA1(spec: string, type: validMSA1): void {
    switch (spec) {
      case "2.1":
        if (!MSA_1_VALUES_v2_1.includes(type)) {
          throw new HL7ServerError(
            `Invalid MSA-1 value: ${type} for HL7 version 2.1`,
          );
        }
        break;
      default:
        if (![...MSA_1_VALUES_v2_1, ...MSA_1_VALUES_v2_x].includes(type)) {
          throw new HL7ServerError(
            `Invalid MSA-1 value: ${type} for HL7 version ${spec}`,
          );
        }
        break;
    }
  }

  /** @internal */
  private _createAEAckMessage(): Message {
    const ackMessage = new Message({
      messageHeader: {
        msh_9_1: "ACK",
        // There is not an MSH 9.2 for ACK a failure.
        // There should be.
        // So we are using Z99, which is not assigned yet.
        msh_9_2: "Z99",
        msh_9_3: "ACK",
        msh_10: "ACK",
        msh_11_1: "P",
      },
    });

    ackMessage.set("MSH.3", ""); // This would need to be set by the application. Maybe from the server class?
    ackMessage.set("MSH.4", ""); // This would need to be set by the application. Maybe from the server class?

    const segment = ackMessage.addSegment("MSA");
    segment.set("1", "AE");
    segment.set("2", randomString());

    return ackMessage;
  }
}
