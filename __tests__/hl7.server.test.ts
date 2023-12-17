import fs from "fs";
import path from "node:path";
import portfinder from 'portfinder'
import tcpPortUsed from 'tcp-port-used'
import {Client, Message} from "node-hl7-client";
import { Server } from '../src'
import {expectEvent, sleep} from "./__utils__";

describe('node hl7 server', () => {

  describe('sanity tests - server class', () => {

    test(`error - bindAddress has to be string`, async  () => {
      try {
        // @ts-expect-error this is not a string
        new Server({bindAddress: 351123})
      } catch (err: any) {
        expect(err.message).toBe('bindAddress is not valid string.')
      }
    })

    test(`error - ipv4 and ipv6 both can not be true exist`, async  () => {
      try {
      new Server({ipv6: true, ipv4: true})
      } catch (err: any) {
        expect(err.message).toBe('ipv4 and ipv6 both can\'t be set to be exclusive.')
      }
    })

    test(`error - ipv4 not empty`, async  () => {
      try {
        new Server({bindAddress: ""})
      } catch (err: any) {
        expect(err.message).toBe('bindAddress is an invalid ipv4 address.')
      }
    })

    test(`error - ipv4 not valid address`, async  () => {
      try {
        new Server({bindAddress: "123.34.52.455"})
      } catch (err: any) {
        expect(err.message).toBe('bindAddress is an invalid ipv4 address.')
      }
    })

    test(`error - ipv6 not empty`, async  () => {
      try {
        new Server({bindAddress: "", ipv6: true, ipv4: false})
      } catch (err: any) {
        expect(err.message).toBe('bindAddress is an invalid ipv6 address.')
      }
    })

    test(`error - ipv6 not valid address`, async  () => {
      try {
        new Server({bindAddress: "2001:0db8:85a3:0000:zz00:8a2e:0370:7334", ipv6: true, ipv4: false})
      } catch (err: any) {
        expect(err.message).toBe('bindAddress is an invalid ipv6 address.')
      }
    })

    test(`error - ipv6 valid address`, async  () => {
      try {
        new Server({bindAddress: "2001:0db8:85a3:0000:0000:8a2e:0370:7334", ipv6: true, ipv4: false})
      } catch (err: any) {
        expect(err.message).toBeUndefined()
      }
    })

    test(`properties exist`, async  () => {
      const server = new Server()
      expect(server).toHaveProperty("createInbound")
    })

  })

  describe('sanity tests - listener class', () => {

    test('error - no port specified', async () => {

      try {
        const server = new Server()
        // @ts-expect-error port is not specified
        server.createInbound()
      } catch (err: any) {
        expect(err.message).toBe('port is not defined.')
      }

    })

    test('error - port not a number', async  () => {
      try {
        const server = new Server()
        // @ts-expect-error port is not specified
        server.createInbound({ port: "12345"}, async () => {})
      } catch (err: any) {
        expect(err.message).toBe('port is not valid number.')
      }
    })

    test('error - port less than 0', async () => {
      try {
        const server = new Server()
        server.createInbound({ port: -1}, async () => {})
      } catch (err: any) {
        expect(err.message).toBe('port must be a number (0, 65353).')
      }
    })

    test('error - port greater than 65353', async () => {
      try {
        const server = new Server()
        server.createInbound({ port: 65354}, async () => {})
      } catch (err: any) {
        expect(err.message).toBe('port must be a number (0, 65353).')
      }
    })

    test('error - name is invalid', async () => {
      try {
        const server = new Server()
        server.createInbound({ name: "$#@!sdfe-`", port: 65354}, async () => {})
      } catch (err: any) {
        expect(err.message).toContain(`name must not contain certain characters: \`!@#$%^&*()+\\-=\\[\\]{};':\"\\\\|,.<>\\/?~.`)
      }
    })

  })

  describe('basic server tests', () => {
    let LISTEN_PORT: number;

    beforeEach(async () => {
      LISTEN_PORT = await portfinder.getPortPromise({
        port: 3000,
        stopPort: 65353
      })
    })

    test('...listen on a randomized port', async () => {
      const server = new Server()
      const listener = server.createInbound({ port: LISTEN_PORT}, async () => {})
      const usedCheck = await tcpPortUsed.check(LISTEN_PORT, '0.0.0.0')

      expect(usedCheck).toBe(true)

      await listener.close()

    })

    test('...should not be able to listen on the same port', async () => {
      const server = new Server()
      const listenerOne = server.createInbound({ port: LISTEN_PORT}, async () => {})
      const listenerTwo = server.createInbound({ port: LISTEN_PORT}, async () => {})

      await expectEvent(listenerTwo, 'error')

      await listenerOne.close()

    })

    test('...two different ports', async () => {
      const server = new Server()
      const listenerOne = server.createInbound({ port: LISTEN_PORT}, async () => {})
      const listenerTwo = server.createInbound({ port: await portfinder.getPortPromise({
          port: 3001,
          stopPort: 65353
        })}, async () => {})

      await listenerOne.close()
      await listenerTwo.close()

    })

    test('...use tls', async () => {

      const server = new Server(
        {
          tls:
            {
              key: fs.readFileSync(path.join('certs/', 'server-key.pem')),
              cert: fs.readFileSync(path.join('certs/', 'server-crt.pem')),
              rejectUnauthorized: false
            }
        })
      const listener = server.createInbound({ port: LISTEN_PORT}, async () => {})

      const usedCheck = await tcpPortUsed.check(LISTEN_PORT, '0.0.0.0')

      expect(usedCheck).toBe(true)

      await listener.close()
    })

  })

  describe('end to end tests', () => {

    describe('...send message, get proper ACK', () => {

      let LISTEN_PORT: number
      beforeEach(async () => {
        LISTEN_PORT = await portfinder.getPortPromise({
          port: 3000,
          stopPort: 65353
        })
      })

      test('...no tls', async () => {

        const server = new Server({bindAddress: '0.0.0.0'})
        const IB_ADT = server.createInbound({port: LISTEN_PORT}, async (req, res) => {
          const messageReq = req.getMessage()
          expect(messageReq.get('MSH.12').toString()).toBe('2.7')
          await res.sendResponse("AA")
        })

        await sleep(5)

        const client = new Client({host: '0.0.0.0'})

        const OB_ADT = client.createOutbound({ port: LISTEN_PORT }, async (res) => {
          expect(res.toString()).not.toContain('ADT^A01^ADT_A01')
        })

        await sleep(5)

        let message = new Message({
          messageHeader: {
            msh_9_1: "ADT",
            msh_9_2: "A01",
            msh_10: 'CONTROL_ID'
          }
        })

        await OB_ADT.sendMessage(message)

        await sleep(10)

        await OB_ADT.close()
        await IB_ADT.close()

      })

      test('...tls', async () => {

        const server = new Server(
          {
            bindAddress: '0.0.0.0',
            tls:
              {
                key: fs.readFileSync(path.join('certs/', 'server-key.pem')),
                cert: fs.readFileSync(path.join('certs/', 'server-crt.pem')),
                rejectUnauthorized: false
              }
          })
        const IB_ADT = server.createInbound({port: LISTEN_PORT}, async (req, res) => {
          const messageReq = req.getMessage()
          expect(messageReq.get('MSH.12').toString()).toBe('2.7')
          await res.sendResponse("AA")
        })

        await sleep(5)

        const client = new Client({host: '0.0.0.0', tls: { rejectUnauthorized: false }})
        const OB_ADT = client.createOutbound({ port: LISTEN_PORT }, async (res) => {
          expect(res.toString()).not.toContain('ADT^A01^ADT_A01')
        })

        await sleep(5)

        let message = new Message({
          messageHeader: {
            msh_9_1: "ADT",
            msh_9_2: "A01",
            msh_10: 'CONTROL_ID'
          }
        })

        await OB_ADT.sendMessage(message)

        await sleep(10)

        await OB_ADT.close()
        await IB_ADT.close()

      })

    })

  })

})