import { MLLPCodec } from "@/utils/codec";
import { validMSA1 } from "@/utils/constants";
import { Socket } from "net";
import { Message } from "node-hl7-client";

/**
 *
 */
export interface ISendRequest {
  /** */
  getAckMessage: () => Message | undefined;
  /** */
  getCodec: () => MLLPCodec;
  /** */
  getSocket: () => Socket;
  /** */
  sendResponse: (type: validMSA1, encoding: BufferEncoding) => Promise<void>;
}
