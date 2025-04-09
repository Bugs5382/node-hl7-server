import fs from "fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import tcpPortUsed from "tcp-port-used";
import Client, { Batch, Message } from "node-hl7-client";
import {
  createDeferred,
  expectEvent,
  generateLargeBase64String,
} from "./__utils__";
import Server from "../src";
import { HL7_2_1 } from "node-hl7-client/hl7";

const port = Number(process.env.TEST_PORT) || 3000;

describe("node hl7 end to end - client", () => {
  describe("server/client sanity checks", () => {
    test("...simple connect .. send AA", async () => {
      let dfd = createDeferred<void>();

      const server = new Server({ bindAddress: "0.0.0.0" });
      const listener = server.createInbound({ port }, async (req, res) => {
        const messageReq = req.getMessage();
        expect(messageReq.get("MSH.12").toString()).toBe("2.7");
        await res.sendResponse("AA");
        const messageRes = res.getAckMessage();
        expect(messageRes?.get("MSA.1").toString()).toBe("AA");
      });

      await expectEvent(listener, "listen");

      const client = new Client({ host: "0.0.0.0" });

      const outbound = client.createConnection({ port }, async (res) => {
        const messageRes = res.getMessage();
        expect(messageRes.get("MSA.1").toString()).toBe("AA");
        dfd.resolve();
      });

      await expectEvent(outbound, "connect");

      let message = new Message({
        messageHeader: {
          msh_9_1: "ADT",
          msh_9_2: "A01",
          msh_10: "CONTROL_ID",
          msh_11_1: "D",
        },
      });

      await outbound.sendMessage(message);

      await dfd.promise;

      expect(client.totalSent()).toEqual(1);
      expect(client.totalAck()).toEqual(1);

      await outbound.close();
      await listener.close();

      client.closeAll();
    });

    test("...simple connect .. send AR", async () => {
      let dfd = createDeferred<void>();

      const server = new Server({ bindAddress: "0.0.0.0" });
      const listener = server.createInbound({ port }, async (req, res) => {
        const messageReq = req.getMessage();
        expect(messageReq.get("MSH.12").toString()).toBe("2.7");
        await res.sendResponse("AR");
        const messageRes = res.getAckMessage();
        expect(messageRes?.get("MSA.1").toString()).toBe("AR");
      });

      await expectEvent(listener, "listen");

      const client = new Client({ host: "0.0.0.0" });

      const outbound = client.createConnection({ port }, async (res) => {
        const messageRes = res.getMessage();
        expect(messageRes.get("MSA.1").toString()).toBe("AR");
        dfd.resolve();
      });

      await expectEvent(outbound, "connect");

      let message = new Message({
        messageHeader: {
          msh_9_1: "ADT",
          msh_9_2: "A01",
          msh_10: "CONTROL_ID",
          msh_11_1: "D",
        },
      });

      await outbound.sendMessage(message);

      await dfd.promise;

      expect(client.totalSent()).toEqual(1);
      expect(client.totalAck()).toEqual(1);

      await outbound.close();
      await listener.close();

      client.closeAll();
    });

    test("...simple connect .. send AE", async () => {
      let dfd = createDeferred<void>();

      const server = new Server({ bindAddress: "0.0.0.0" });
      const listener = server.createInbound({ port }, async (req, res) => {
        const messageReq = req.getMessage();
        expect(messageReq.get("MSH.12").toString()).toBe("2.7");
        await res.sendResponse("AE");
        const messageRes = res.getAckMessage();
        expect(messageRes?.get("MSA.1").toString()).toBe("AE");
      });

      await expectEvent(listener, "listen");

      const client = new Client({ host: "0.0.0.0" });

      const outbound = client.createConnection({ port }, async (res) => {
        const messageRes = res.getMessage();
        expect(messageRes.get("MSA.1").toString()).toBe("AE");
        dfd.resolve();
      });

      await expectEvent(outbound, "connect");

      let message = new Message({
        messageHeader: {
          msh_9_1: "ADT",
          msh_9_2: "A01",
          msh_10: "CONTROL_ID",
          msh_11_1: "D",
        },
      });

      await outbound.sendMessage(message);

      await dfd.promise;

      expect(client.totalSent()).toEqual(1);
      expect(client.totalAck()).toEqual(1);

      await outbound.close();
      await listener.close();

      client.closeAll();
    });

    test("...simple connect .. send CA", async () => {
      let dfd = createDeferred<void>();

      const server = new Server({ bindAddress: "0.0.0.0" });
      const listener = server.createInbound({ port }, async (req, res) => {
        const messageReq = req.getMessage();
        expect(messageReq.get("MSH.12").toString()).toBe("2.7");
        await res.sendResponse("CA");
        const messageRes = res.getAckMessage();
        expect(messageRes?.get("MSA.1").toString()).toBe("CA");
      });

      await expectEvent(listener, "listen");

      const client = new Client({ host: "0.0.0.0" });

      const outbound = client.createConnection({ port }, async (res) => {
        const messageRes = res.getMessage();
        expect(messageRes.get("MSA.1").toString()).toBe("CA");
        dfd.resolve();
      });

      await expectEvent(outbound, "connect");

      let message = new Message({
        messageHeader: {
          msh_9_1: "ADT",
          msh_9_2: "A01",
          msh_10: "CONTROL_ID",
          msh_11_1: "D",
        },
      });

      await outbound.sendMessage(message);

      await dfd.promise;

      expect(client.totalSent()).toEqual(1);
      expect(client.totalAck()).toEqual(1);

      await outbound.close();
      await listener.close();

      client.closeAll();
    });

    test("...simple connect .. send CR", async () => {
      let dfd = createDeferred<void>();

      const server = new Server({ bindAddress: "0.0.0.0" });
      const listener = server.createInbound({ port }, async (req, res) => {
        const messageReq = req.getMessage();
        expect(messageReq.get("MSH.12").toString()).toBe("2.7");
        await res.sendResponse("CR");
        const messageRes = res.getAckMessage();
        expect(messageRes?.get("MSA.1").toString()).toBe("CR");
      });

      await expectEvent(listener, "listen");

      const client = new Client({ host: "0.0.0.0" });

      const outbound = client.createConnection({ port }, async (res) => {
        const messageRes = res.getMessage();
        expect(messageRes.get("MSA.1").toString()).toBe("CR");
        dfd.resolve();
      });

      await expectEvent(outbound, "connect");

      let message = new Message({
        messageHeader: {
          msh_9_1: "ADT",
          msh_9_2: "A01",
          msh_10: "CONTROL_ID",
          msh_11_1: "D",
        },
      });

      await outbound.sendMessage(message);

      await dfd.promise;

      expect(client.totalSent()).toEqual(1);
      expect(client.totalAck()).toEqual(1);

      await outbound.close();
      await listener.close();

      client.closeAll();
    });

    test("...simple connect .. send CE", async () => {
      let dfd = createDeferred<void>();

      const server = new Server({ bindAddress: "0.0.0.0" });
      const listener = server.createInbound({ port }, async (req, res) => {
        const messageReq = req.getMessage();
        expect(messageReq.get("MSH.12").toString()).toBe("2.7");
        await res.sendResponse("CE");
        const messageRes = res.getAckMessage();
        expect(messageRes?.get("MSA.1").toString()).toBe("CE");
      });

      await expectEvent(listener, "listen");

      const client = new Client({ host: "0.0.0.0" });

      const outbound = client.createConnection({ port }, async (res) => {
        const messageRes = res.getMessage();
        expect(messageRes.get("MSA.1").toString()).toBe("CE");
        dfd.resolve();
      });

      await expectEvent(outbound, "connect");

      let message = new Message({
        messageHeader: {
          msh_9_1: "ADT",
          msh_9_2: "A01",
          msh_10: "CONTROL_ID",
          msh_11_1: "D",
        },
      });

      await outbound.sendMessage(message);

      await dfd.promise;

      expect(client.totalSent()).toEqual(1);
      expect(client.totalAck()).toEqual(1);

      await outbound.close();
      await listener.close();

      client.closeAll();
    });

    test("...simple connect .. send CA when version is 2.1 .. expect AE", async () => {
      let dfd = createDeferred<void>();

      const server = new Server({ bindAddress: "0.0.0.0" });
      const listener = server.createInbound({ port }, async (req, res) => {
        const messageReq = req.getMessage();
        expect(messageReq.get("MSH.12").toString()).toBe("2.1");
        await res.sendResponse("CA");
      });

      await expectEvent(listener, "listen");

      const client = new Client({ host: "0.0.0.0" });

      const outbound = client.createConnection({ port }, async (res) => {
        const messageRes = res.getMessage();
        expect(messageRes.get("MSA.1").toString()).toBe("AE");
        dfd.resolve();
      });

      await expectEvent(outbound, "connect");

      let message = new Message({
        specification: new HL7_2_1(),
        messageHeader: {
          msh_9: "ADT",
          msh_9_1: "ADT",
          msh_9_2: "A01",
          msh_10: "CONTROL_ID",
          msh_11_1: "D",
        },
      });

      await outbound.sendMessage(message);

      await dfd.promise;

      expect(client.totalSent()).toEqual(1);
      expect(client.totalAck()).toEqual(1);

      await outbound.close();
      await listener.close();

      client.closeAll();
    });

    test("...simple connect ... MSH overrides", async () => {
      let dfd = createDeferred<void>();

      const server = new Server({ bindAddress: "0.0.0.0" });
      const listener = server.createInbound(
        {
          port,
          mshOverrides: {
            // override: set MSH.7 to timestamp of an original message + 1 ms
            "7": (message) => `${Number(message.get("MSH.7").toString()) + 1}`,
            // override: set MSH.8 to "FOO" via callback
            "8": () => "FOO",
            // override: set MSH.9.3 to "ACK"
            "9.3": "ACK",
            // override: set MSH.18 to "UNICODE UTF-8"
            "18": "UNICODE UTF-8",
          },
        },
        async (req, res) => {
          const messageReq = req.getMessage();
          expect(messageReq.get("MSH.12").toString()).toBe("2.7");
          await res.sendResponse("AA");
          const messageRes = res.getAckMessage();

          expect(messageRes?.get("MSA.1").toString()).toBe("AA");

          const messageReqTimestamp = Number(
            messageReq?.get("MSH.7").toString(),
          );
          const messageResTimestamp = Number(
            messageRes?.get("MSH.7").toString(),
          );
          expect(messageResTimestamp).toBe(messageReqTimestamp + 1);
          expect(messageRes?.get("MSH.8").toString()).toBe("FOO");
          expect(messageRes?.get("MSH.9.3").toString()).toBe("ACK");
          expect(messageRes?.get("MSH.18").toString()).toBe("UNICODE UTF-8");
        },
      );

      await expectEvent(listener, "listen");

      const client = new Client({ host: "0.0.0.0" });

      const outbound = client.createConnection({ port }, async (res) => {
        const messageRes = res.getMessage();
        expect(messageRes.get("MSA.1").toString()).toBe("AA");
        dfd.resolve();
      });

      await expectEvent(outbound, "connect");

      let message = new Message({
        messageHeader: {
          msh_9_1: "ADT",
          msh_9_2: "A01",
          msh_10: "CONTROL_ID",
          msh_11_1: "D",
        },
      });

      await outbound.sendMessage(message);

      await dfd.promise;

      expect(client.totalSent()).toEqual(1);
      expect(client.totalAck()).toEqual(1);

      await outbound.close();
      await listener.close();

      client.closeAll();
    });

    test("...send simple message twice, no ACK needed before sending the next message", async () => {
      await tcpPortUsed.check(3000, "0.0.0.0");

      let dfd = createDeferred<void>();

      const server = new Server({ bindAddress: "0.0.0.0" });
      const listener = server.createInbound({ port }, async (req, res) => {
        const messageReq = req.getMessage();
        expect(messageReq.get("MSH.12").toString()).toBe("2.7");
        await res.sendResponse("AA");
        const messageRes = res.getAckMessage();
        expect(messageRes?.get("MSA.1").toString()).toBe("AA");
      });

      await expectEvent(listener, "listen");

      const client = new Client({ host: "0.0.0.0" });
      const outbound = client.createConnection(
        { port, waitAck: false },
        async () => {
          dfd.resolve();
        },
      );

      await expectEvent(outbound, "connect");

      let message = new Message({
        messageHeader: {
          msh_9_1: "ADT",
          msh_9_2: "A01",
          msh_10: "CONTROL_ID",
          msh_11_1: "D",
        },
      });

      await outbound.sendMessage(message);

      let message2 = new Message({
        messageHeader: {
          msh_9_1: "ADT",
          msh_9_2: "A01",
          msh_10: "CONTROL_ID_01",
          msh_11_1: "D",
        },
      });

      await outbound.sendMessage(message2);

      await dfd.promise;

      expect(client.totalSent()).toEqual(2);
      expect(client.totalAck()).toEqual(2);

      await outbound.close();
      await listener.close();

      client.closeAll();
    });
  });

  describe("server/client failure checks", () => {
    test.skip("...host does not exist, error out", async () => {
      const client = new Client({ host: "0.0.0.0" });
      const outbound = client.createConnection(
        { port: 1234, maxConnectionAttempts: 1 },
        async () => {},
      );

      const error = await expectEvent(outbound, "client.error");
      expect(error.code).toBe("ECONNREFUSED");
    });
  });

  describe("...no tls", () => {
    describe("...no file", () => {
      test("...send batch with two message, get proper ACK", async () => {
        let dfd = createDeferred<void>();

        const server = new Server({ bindAddress: "0.0.0.0" });
        const inbound = server.createInbound({ port }, async (req, res) => {
          const messageReq = req.getMessage();
          expect(messageReq.get("MSH.12").toString()).toBe("2.7");
          await res.sendResponse("AA");
          const messageRes = res.getAckMessage();
          expect(messageRes?.get("MSA.1").toString()).toBe("AA");
        });

        await expectEvent(inbound, "listen");

        const client = new Client({ host: "0.0.0.0" });
        const outbound = client.createConnection({ port }, async (res) => {
          const messageRes = res.getMessage();
          expect(messageRes.get("MSA.1").toString()).toBe("AA");
          dfd.resolve();
        });

        const batch = new Batch();
        batch.start();

        const message = new Message({
          messageHeader: {
            msh_9_1: "ADT",
            msh_9_2: "A01",
            msh_10: "CONTROL_ID",
            msh_11_1: "D",
          },
        });

        batch.add(message);
        batch.add(message);

        batch.end();

        await outbound.sendMessage(batch);

        await dfd.promise;

        expect(client.totalSent()).toEqual(1);
        expect(client.totalAck()).toEqual(2);

        await outbound.close();
        await inbound.close();

        client.closeAll();
      });
    });
  });

  describe("...tls", () => {
    describe("...no file", () => {
      test("...simple", async () => {
        let dfd = createDeferred<void>();

        const server = new Server({
          bindAddress: "0.0.0.0",
          tls: {
            key: fs.readFileSync(path.join("certs/", "server-key.pem")),
            cert: fs.readFileSync(path.join("certs/", "server-crt.pem")),
            rejectUnauthorized: false,
          },
        });
        const inbound = server.createInbound({ port }, async (req, res) => {
          const messageReq = req.getMessage();
          expect(messageReq.get("MSH.12").toString()).toBe("2.7");
          await res.sendResponse("AA");
          const messageRes = res.getAckMessage();
          expect(messageRes?.get("MSA.1").toString()).toBe("AA");
        });

        await expectEvent(inbound, "listen");

        const client = new Client({
          host: "0.0.0.0",
          tls: { rejectUnauthorized: false },
        });
        const outbound = client.createConnection({ port }, async (res) => {
          const messageRes = res.getMessage();
          expect(messageRes.get("MSA.1").toString()).toBe("AA");
          dfd.resolve();
        });

        await expectEvent(outbound, "connect");

        const message = new Message({
          messageHeader: {
            msh_9_1: "ADT",
            msh_9_2: "A01",
            msh_10: "CONTROL_ID",
            msh_11_1: "D",
          },
        });

        await outbound.sendMessage(message);

        dfd.promise;

        await outbound.close();
        await inbound.close();

        client.closeAll();
      });
    });
  });

  describe("server/client large data checks", () => {
    test("...large encapsulated data", async () => {
      let dfd = createDeferred<void>();

      const server = new Server({ bindAddress: "0.0.0.0" });
      const listener = server.createInbound({ port }, async (req, res) => {
        const messageReq = req.getMessage();
        expect(messageReq.get("MSH.12").toString()).toBe("2.7");
        expect(messageReq.get("OBX.3.1").toString()).toBe("SOME-PDF");
        await res.sendResponse("AA");
        const messageRes = res.getAckMessage();
        expect(messageRes?.get("MSA.1").toString()).toBe("AA");
      });

      await expectEvent(listener, "listen");

      const client = new Client({ host: "0.0.0.0" });

      const outbound = client.createConnection({ port }, async (res) => {
        const messageRes = res.getMessage();
        expect(messageRes.get("MSA.1").toString()).toBe("AA");
        dfd.resolve();
      });

      await expectEvent(outbound, "connect");

      let message = new Message({
        messageHeader: {
          msh_9_1: "ADT",
          msh_9_2: "A01",
          msh_10: "CONTROL_ID",
          msh_11_1: "D",
        },
      });

      // Add Patient level observation result
      const OBX = message.addSegment("OBX"); // Adds the OBX as a segment for this MSH.
      OBX.set("1", "1"); // Sequence ID
      OBX.set("2", "ED"); // Type Encapsulated Data
      OBX.set("3.1", "SOME-PDF"); // Identifier (max 20 chars)
      OBX.set("3.2", "Result Report"); // Title (max 199 chars)
      OBX.set("3.3", "99COD"); // Some Coding System
      OBX.set("5.2", "application"); // Type of referenced data
      OBX.set("5.3", "pdf"); // Data Sub type
      OBX.set("5.4", "Base64"); // PDF Data
      OBX.set("5.5", generateLargeBase64String(600)); // PDF Data
      OBX.set("8", "A"); // (A)bnormal or (N)ormal result
      OBX.set("11", "F"); // Final result or correction to final result
      OBX.set("14", "20240625103600"); // Result creation time

      await outbound.sendMessage(message);

      await dfd.promise;

      expect(client.totalSent()).toEqual(1);
      expect(client.totalAck()).toEqual(1);

      await outbound.close();
      await listener.close();

      client.closeAll();
    });
  });
});
