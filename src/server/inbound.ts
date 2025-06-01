import { MLLPCodec } from "@/utils/codec";
import { ListenerOptions, normalizeListenerOptions } from "@/utils/normalize";
import EventEmitter from "events";
import net, { Socket } from "net";
import { Batch, FileBatch, Message, isBatch, isFile } from "node-hl7-client";
import tls from "tls";
import { InboundRequest } from "./modules/inboundRequest";
import { SendResponse } from "./modules/sendResponse";
import { Server } from "./server";

/**
 * Inbound Handler
 * @remarks The handler that will handle the user parsing a received message by the client to the server.
 * @since 1.0.0
 * @example
 * In this example, we are processing the results in an async handler.
 *```ts
 *  const IB_ADT = server.createInbound({port: 3000}, async (req, res) => {
 *    const messageReq = req.getMessage()
 *    const messageRes = res.getAckMessage()
 *  })
 *```
 */
export type InboundHandler = (req: InboundRequest, res: SendResponse) => void;

export interface IInbound extends EventEmitter {
  /** When the connection form the client is closed. We might have an error, we might not. */
  on(name: "client.close", cb: (hasError: boolean) => void): this;
  /** When a connection from the client is made. */
  on(name: "client.connect", cb: (socket: Socket) => void): this;
  /** When an error was sent by the connecting source. */
  on(name: "client.error", cb: (err: any) => void): this;
  /** Something wrong happened during data parsing. */
  on(name: "data.error", cb: (err: any) => void): this;
  /** The raw data received by this particular inbound connection. */
  on(name: "data.raw", cb: (rawData: string) => void): this;
  /** When the socket itself has an error. */
  on(name: "error", cb: (err: any) => void): this;
  /** When the socket is ready and listening on the port. */
  on(name: "listen", cb: () => void): this;
  /** An HL7 response was sent */
  on(name: "response.sent", cb: () => void): this;
}

/**
 * Inbound Listener Class
 * @since 1.0.0
 */
export class Inbound extends EventEmitter implements IInbound {
  /** @internal */
  readonly stats = {
    /** Total message received to server.
     * @since 2.0.0 */
    received: 0,
    /** Total message parsed by the server..
     * @since 2.0.0 */
    totalMessage: 0,
  };
  /** @internal */
  private readonly _handler: (req: InboundRequest, res: SendResponse) => void;
  /** @internal */
  _main: Server;
  /** @internal */
  _opt: ReturnType<typeof normalizeListenerOptions>;
  /** @internal */
  private readonly _socket: net.Server | tls.Server;
  /** @internal */
  private readonly _sockets: Socket[];
  /** @internal */
  private _dataResult: boolean | undefined;
  /** @internal */
  private _codec: MLLPCodec | null;

  /**
   * Build a Listener
   * @since 1.0.0
   * @param server
   * @param props
   * @param handler
   */
  constructor(server: Server, props: ListenerOptions, handler: InboundHandler) {
    super();

    this._handler = handler;
    this._main = server;

    this._opt = normalizeListenerOptions(props);

    this._sockets = [];

    this._listen = this._listen.bind(this);
    this._onTcpClientConnected = this._onTcpClientConnected.bind(this);

    this._codec = null;

    this._socket = this._listen();
  }

  /** Close Listener Instance.
   * This be called for each listener, but if the server instance is closed and shut down, this will also fire off.
   * @since 1.0.0 */
  async close(): Promise<boolean> {
    this._sockets.forEach((socket) => {
      socket.destroy();
    });

    this._socket?.close(() => {
      this._socket?.unref();
    });

    return true;
  }

  /** @internal */
  private _listen(): net.Server | tls.Server {
    let socket: net.Server | tls.Server;
    const port = this._opt.port;
    const bindAddress = this._main._opt.bindAddress;
    const ipv6 = this._main._opt.ipv6;

    if (typeof this._main._opt.tls !== "undefined") {
      const { key, cert, requestCert, ca } = this._main._opt.tls;
      socket = tls.createServer({ key, cert, requestCert, ca }, (socket) => {
        this._codec = new MLLPCodec(this._main._opt.encoding);
        this._onTcpClientConnected(socket);
      });
    } else {
      socket = net.createServer((socket) => {
        this._codec = new MLLPCodec(this._main._opt.encoding);
        this._onTcpClientConnected(socket);
      });
    }

    socket.on("error", (err) => {
      this.emit("error", err);
    });

    socket.listen({ port, ipv6Only: ipv6, hostname: bindAddress }, () => {
      this.emit("listen");
    });

    return socket;
  }

  /** @internal */
  private _onTcpClientConnected(socket: Socket): void {
    // add socked connection to array
    this._sockets.push(socket);

    // no delay in processing the message
    socket.setNoDelay(true);

    socket.on("data", (buffer) => {
      socket.cork();

      try {
        this._dataResult = this._codec?.receiveData(buffer);
      } catch (err) {
        this.emit("data.error", err);
      }

      socket.uncork();

      if (this._dataResult === true) {
        // we got a message, we don't care if it's good or not
        ++this.stats.received;

        const loadedMessage = this._codec?.getLastMessage();

        try {
          // copy the completed message to continue processing and clear the buffer
          const completedMessageCopy = JSON.parse(
            JSON.stringify(loadedMessage),
          );

          // parser either is batch or a message
          let parser: FileBatch | Batch | Message;

          // send raw information to the emitting
          this.emit("data.raw", completedMessageCopy);

          if (isFile(completedMessageCopy)) {
            // parser the batch
            parser = new FileBatch({ text: completedMessageCopy });
            // load the messages
            const allMessage = parser.messages();
            allMessage.forEach((message: Message) => {
              // parse this message
              const messageParsed = new Message({ text: message.toString() });
              // increase the total message
              ++this.stats.totalMessage;
              // create the inbound request
              const req = new InboundRequest(messageParsed, { type: "file" });
              // create the send response function
              const res = new SendResponse(
                socket,
                message,
                this._opt.mshOverrides,
              );
              // on a response sent, tell the inbound listener
              res.on("response.sent", () => {
                this.emit("response.sent");
              });
              void this._handler(req, res);
            });
          } else if (isBatch(completedMessageCopy)) {
            // parser the batch
            parser = new Batch({ text: completedMessageCopy });
            // load the messages
            const allMessage = parser.messages();
            // loop messages
            allMessage.forEach((message: Message) => {
              // parse this message
              const messageParsed = new Message({ text: message.toString() });
              // increase the total message
              ++this.stats.totalMessage;
              // create the inbound request
              const req = new InboundRequest(messageParsed, { type: "file" });
              // create the send response function
              const res = new SendResponse(
                socket,
                messageParsed,
                this._opt.mshOverrides,
              );
              res.on("response.sent", () => {
                this.emit("response.sent");
              });
              // on a response sent, tell the inbound listener
              void this._handler(req, res);
            });
          } else {
            // parse this message
            const messageParsed = new Message({ text: completedMessageCopy });
            // increase the total message
            ++this.stats.totalMessage;
            // create the inbound request
            const req = new InboundRequest(messageParsed, { type: "file" });
            // create the send response function
            const res = new SendResponse(
              socket,
              messageParsed,
              this._opt.mshOverrides,
            );
            res.on("response.sent", () => {
              this.emit("response.sent");
            });
            // on a response sent, tell the inbound listener
            void this._handler(req, res);
          }
        } catch (err) {
          this.emit("data.error", err);
        }
      }
    });

    socket.on("error", (err) => {
      this.emit("client.error", err);
      this._closeSocket(socket);
    });

    socket.on("close", (hadError) => {
      this.emit("client.close", hadError);
      this._closeSocket(socket);
    });

    this.emit("client.connect", socket);
  }

  /** @internal */
  private _closeSocket(socket: Socket): void {
    socket.destroy();
    this._sockets.splice(this._sockets.indexOf(socket), 1);
  }
}
