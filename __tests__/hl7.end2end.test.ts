import fs from 'fs'
import { Batch, Client, Message } from 'node-hl7-client'
// import {Batch, Client, Message} from "../../node-hl7-client/src"; // used for debugging
import path from 'node:path'
import portfinder from 'portfinder'
import tcpPortUsed from 'tcp-port-used'
import { Server } from '../src'
import { createDeferred, Deferred, expectEvent, sleep } from './__utils__'

describe('node hl7 end to end - server', () => {
  let dfd: Deferred<void>

  describe('basic server tests', () => {
    let LISTEN_PORT: number

    beforeEach(async () => {
      LISTEN_PORT = await portfinder.getPortPromise({
        port: 3000,
        stopPort: 65353
      })
    })

    test('...listen on a randomized port', async () => {
      const server = new Server()
      const listener = server.createInbound({ port: LISTEN_PORT }, async () => {})

      await expectEvent(listener, 'listen')

      const usedCheck = await tcpPortUsed.check(LISTEN_PORT, '0.0.0.0')

      expect(usedCheck).toBe(true)

      await listener.close()
    })

    test('...should not be able to listen on the same port', async () => {
      const server = new Server()
      const listenerOne = server.createInbound({ port: LISTEN_PORT }, async () => {})

      await expectEvent(listenerOne, 'listen')

      const listenerTwo = server.createInbound({ port: LISTEN_PORT + 1 }, async () => {})

      await expectEvent(listenerTwo, 'listen')

      await listenerOne.close()
      await listenerTwo.close()
    })

    test('...two different ports', async () => {
      const server = new Server()
      const listenerOne = server.createInbound({ port: LISTEN_PORT }, async () => {})

      await expectEvent(listenerOne, 'listen')

      const listenerTwo = server.createInbound({
        port: await portfinder.getPortPromise({
          port: 3001,
          stopPort: 65353
        })
      }, async () => {})

      await expectEvent(listenerTwo, 'listen')

      await listenerOne.close()
      await listenerTwo.close()
    })
  })

  describe('...send message, get proper ACK', () => {
    let LISTEN_PORT: number

    beforeEach(async () => {
      LISTEN_PORT = await portfinder.getPortPromise({
        port: 3000,
        stopPort: 65353
      })

      dfd = createDeferred<void>()
    })

    test('...no tls', async () => {
      const server = new Server({ bindAddress: '0.0.0.0' })
      const IB_ADT = server.createInbound({ port: LISTEN_PORT }, async (req, res) => {
        const messageReq = req.getMessage()
        const messageType = req.getType()
        expect(messageType).toBe('message')
        expect(messageReq.get('MSH.12').toString()).toBe('2.7')
        await res.sendResponse('AA')
      })

      await expectEvent(IB_ADT, 'listen')

      const client = new Client({ host: '0.0.0.0' })
      const OB_ADT = client.createOutbound({ port: LISTEN_PORT }, async (res) => {
        const messageRes = res.getMessage()
        expect(messageRes.get('MSA.1').toString()).toBe('AA')
        dfd.resolve()
      })

      await expectEvent(OB_ADT, 'client.connect')

      const message = new Message({
        messageHeader: {
          msh_9_1: 'ADT',
          msh_9_2: 'A01',
          msh_10: 'CONTROL_ID',
          msh_11_1: 'D'
        }
      })

      await OB_ADT.sendMessage(message)

      await sleep(10)

      dfd.promise

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
      const IB_ADT = server.createInbound({ port: LISTEN_PORT }, async (req, res) => {
        const messageReq = req.getMessage()
        const messageType = req.getType()
        expect(messageType).toBe('message')
        expect(messageReq.get('MSH.12').toString()).toBe('2.7')
        await res.sendResponse('AA')
      })

      await expectEvent(IB_ADT, 'listen')

      const client = new Client({ host: '0.0.0.0', tls: { rejectUnauthorized: false } })
      const OB_ADT = client.createOutbound({ port: LISTEN_PORT }, async (res) => {
        const messageRes = res.getMessage()
        expect(messageRes.get('MSA.1').toString()).toBe('AA')
        dfd.resolve()
      })

      await expectEvent(OB_ADT, 'client.connect')

      const message = new Message({
        messageHeader: {
          msh_9_1: 'ADT',
          msh_9_2: 'A01',
          msh_10: 'CONTROL_ID',
          msh_11_1: 'D'
        }
      })

      await OB_ADT.sendMessage(message)

      await sleep(10)

      dfd.promise

      await OB_ADT.close()
      await IB_ADT.close()
    })
  })

  describe('...send batch with one message, get proper ACK', () => {
    let LISTEN_PORT: number
    beforeEach(async () => {
      LISTEN_PORT = await portfinder.getPortPromise({
        port: 3000,
        stopPort: 65353
      })

      dfd = createDeferred<void>()
    })

    test('...no tls', async () => {
      const server = new Server({ bindAddress: '0.0.0.0' })
      const IB_ADT = server.createInbound({ port: LISTEN_PORT }, async (req, res) => {
        const messageReq = req.getMessage()
        const messageType = req.getType()
        expect(messageType).toBe('batch')
        expect(messageReq.get('MSH.12').toString()).toBe('2.7')
        await res.sendResponse('AA')
      })

      await expectEvent(IB_ADT, 'listen')

      const client = new Client({ host: '0.0.0.0' })
      const OB_ADT = client.createOutbound({ port: LISTEN_PORT }, async (res) => {
        const messageRes = res.getMessage()
        expect(messageRes.get('MSA.1').toRaw()).toBe('AA')
        dfd.resolve()
      })

      await expectEvent(OB_ADT, 'client.connect')

      const batch = new Batch()
      batch.start()

      const message = new Message({
        messageHeader: {
          msh_9_1: 'ADT',
          msh_9_2: 'A01',
          msh_10: 'CONTROL_ID1',
          msh_11_1: 'D'
        }
      })

      batch.add(message)

      batch.end()

      await OB_ADT.sendMessage(batch)

      await sleep(10)

      dfd.promise

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
      const IB_ADT = server.createInbound({ port: LISTEN_PORT }, async (req, res) => {
        const messageReq = req.getMessage()
        const messageType = req.getType()
        expect(messageType).toBe('batch')
        expect(messageReq.get('MSH.12').toString()).toBe('2.7')
        await res.sendResponse('AA')
      })

      await expectEvent(IB_ADT, 'listen')

      const client = new Client({ host: '0.0.0.0', tls: { rejectUnauthorized: false } })
      const OB_ADT = client.createOutbound({ port: LISTEN_PORT }, async (res) => {
        const messageRes = res.getMessage()
        expect(messageRes.get('MSA.1').toString()).toBe('AA')
        dfd.resolve()
      })

      await expectEvent(OB_ADT, 'client.connect')

      const batch = new Batch()
      batch.start()

      const message = new Message({
        messageHeader: {
          msh_9_1: 'ADT',
          msh_9_2: 'A01',
          msh_10: 'CONTROL_ID',
          msh_11_1: 'D'
        }
      })

      batch.add(message)

      batch.end()

      await OB_ADT.sendMessage(batch)

      await sleep(10)

      dfd.promise

      await OB_ADT.close()
      await IB_ADT.close()
    })
  })

  describe('...send batch with two message, get proper ACK', () => {
    let LISTEN_PORT: number
    beforeEach(async () => {
      LISTEN_PORT = await portfinder.getPortPromise({
        port: 3000,
        stopPort: 65353
      })

      dfd = createDeferred<void>()
    })

    test('...no tls', async () => {
      const server = new Server({ bindAddress: '0.0.0.0' })
      const IB_ADT = server.createInbound({ port: LISTEN_PORT }, async (req, res) => {
        const messageReq = req.getMessage()
        const messageType = req.getType()
        expect(messageType).toBe('batch')
        expect(messageReq.get('MSH.12').toString()).toBe('2.7')
        await res.sendResponse('AA')
      })

      await expectEvent(IB_ADT, 'listen')

      let count: number = 0
      const client = new Client({ host: '0.0.0.0' })
      const OB_ADT = client.createOutbound({ port: LISTEN_PORT }, async (res) => {
        const messageRes = res.getMessage()
        expect(messageRes.get('MSA.1').toString()).toBe('AA')
        count = count + 1
        if (count === 2) {
          dfd.resolve()
        }
      })

      await expectEvent(OB_ADT, 'client.connect')

      const batch = new Batch()
      batch.start()

      let message = new Message({
        messageHeader: {
          msh_9_1: 'ADT',
          msh_9_2: 'A01',
          msh_10: 'CONTROL_ID1',
          msh_11_1: 'D'
        }
      })

      batch.add(message)

      message = new Message({
        messageHeader: {
          msh_9_1: 'ADT',
          msh_9_2: 'A01',
          msh_10: 'CONTROL_ID2',
          msh_11_1: 'D'
        }
      })

      batch.add(message)

      batch.end()

      await OB_ADT.sendMessage(batch)

      await sleep(10)

      dfd.promise

      expect(count).toBe(2)

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
      const IB_ADT = server.createInbound({ port: LISTEN_PORT }, async (req, res) => {
        const messageReq = req.getMessage()
        const messageType = req.getType()
        expect(messageType).toBe('batch')
        expect(messageReq.get('MSH.12').toString()).toBe('2.7')
        await res.sendResponse('AA')
      })

      await expectEvent(IB_ADT, 'listen')

      let count: number = 0
      const client = new Client({ host: '0.0.0.0', tls: { rejectUnauthorized: false } })
      const OB_ADT = client.createOutbound({ port: LISTEN_PORT }, async (res) => {
        const messageRes = res.getMessage()
        expect(messageRes.get('MSA.1').toString()).toBe('AA')
        count = count + 1
        if (count === 2) {
          dfd.resolve()
        }
      })

      await expectEvent(OB_ADT, 'client.connect')

      const batch = new Batch()
      batch.start()

      const message = new Message({
        messageHeader: {
          msh_9_1: 'ADT',
          msh_9_2: 'A01',
          msh_10: 'CONTROL_ID',
          msh_11_1: 'D'
        }
      })

      batch.add(message)
      batch.add(message)

      batch.end()

      await OB_ADT.sendMessage(batch)

      await sleep(10)

      dfd.promise

      await OB_ADT.close()
      await IB_ADT.close()
    })
  })

  describe('...send file with one message, get proper ACK', () => {
    let LISTEN_PORT: number

    const hl7_string: string = 'MSH|^~\\&|||||20081231||ADT^A01^ADT_A01|12345|D|2.7\rEVN||20081231'

    beforeAll(async () => {
      fs.readdir('temp/', (err, files) => {
        if (err != null) return
        for (const file of files) {
          fs.unlink(path.join('temp/', file), (err) => {
            if (err != null) throw err
          })
        }
      })

      await sleep(2)

      const message = new Message({ text: hl7_string, date: '8' })
      message.toFile('readFileTestMSH', true, 'temp/')

      fs.access('temp/hl7.readFileTestMSH.20081231.hl7', fs.constants.F_OK, (err) => {
        if (err == null) {
          // Do something
        }
      })

      await (async () => {
        try {
          await fs.promises.access('temp/hl7.readFileTestMSH.20081231.hl7', fs.constants.F_OK)
          // Do something
        } catch (err) {
          // Handle error
        }
      })()
    })

    beforeEach(async () => {
      LISTEN_PORT = await portfinder.getPortPromise({
        port: 3000,
        stopPort: 65353
      })

      dfd = createDeferred<void>()
    })

    test('...no tls', async () => {
      const server = new Server({ bindAddress: '0.0.0.0' })
      const IB_ADT = server.createInbound({ port: LISTEN_PORT }, async (req, res) => {
        const messageReq = req.getMessage()
        expect(messageReq.get('MSH.12').toString()).toBe('2.7')
        await res.sendResponse('AA')
      })

      await expectEvent(IB_ADT, 'listen')

      const client = new Client({ host: '0.0.0.0' })
      const OB_ADT = client.createOutbound({ port: LISTEN_PORT }, async (res) => {
        const messageRes = res.getMessage()
        expect(messageRes.get('MSA.1').toString()).toBe('AA')
        dfd.resolve()
      })

      await expectEvent(OB_ADT, 'client.connect')

      const fileBatch = await OB_ADT.readFile('temp/hl7.readFileTestMSH.20081231.hl7')

      await OB_ADT.sendMessage(fileBatch)

      await dfd.promise

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
      const IB_ADT = server.createInbound({ port: LISTEN_PORT }, async (req, res) => {
        const messageReq = req.getMessage()
        expect(messageReq.get('MSH.12').toString()).toBe('2.7')
        await res.sendResponse('AA')
      })

      await expectEvent(IB_ADT, 'listen')

      const client = new Client({ host: '0.0.0.0', tls: { rejectUnauthorized: false } })
      const OB_ADT = client.createOutbound({ port: LISTEN_PORT }, async (res) => {
        const messageRes = res.getMessage()
        expect(messageRes.get('MSA.1').toString()).toBe('AA')
        dfd.resolve()
      })

      await expectEvent(OB_ADT, 'client.connect')

      const fileBatch = await OB_ADT.readFile('temp/hl7.readFileTestMSH.20081231.hl7')

      await OB_ADT.sendMessage(fileBatch)

      await dfd.promise

      await OB_ADT.close()
      await IB_ADT.close()
    })
  })

  describe('...send file with two message, get proper ACK', () => {
    let LISTEN_PORT: number
    let fileName: string

    const hl7_string: string[] = [
      "MSH|^~\\&|||||20081231||ADT^A01^ADT_A01|12345|D|2.7\rEVN||20081231",
      "MSH|^~\\&|||||20081231||ADT^A01^ADT_A01|12345|D|2.7\rEVN||20081231"
    ]

    beforeAll(async () => {
      fs.readdir('temp/', (err, files) => {
        if (err != null) return
        for (const file of files) {
          fs.unlink(path.join('temp/', file), (err) => {
            if (err != null) throw err
          })
        }
      })

      await sleep(2)

      const batch = new Batch()

      batch.start()

      for (let i = 0; i < hl7_string.length; i++) {
        const message = new Message({text: hl7_string[i] })
        batch.add(message)
      }

      batch.end()

      fileName = batch.toFile('readFileTestMSH', true, 'temp/')

      fs.access(`temp/${fileName as string}`, fs.constants.F_OK, (err) => {
        if (err == null) {
          // Do something
        }
      })

      await (async () => {
        try {
          await fs.promises.access(`temp/${fileName as string}`, fs.constants.F_OK)
          // Do something
        } catch (err) {
          // Handle error
        }
      })()
    })

    beforeEach(async () => {
      LISTEN_PORT = await portfinder.getPortPromise({
        port: 3000,
        stopPort: 65353
      })

      dfd = createDeferred<void>()
    })

    test('...no tls', async () => {
      const server = new Server({ bindAddress: '0.0.0.0' })
      const IB_ADT = server.createInbound({ port: LISTEN_PORT }, async (req, res) => {
        const messageReq = req.getMessage()
        expect(messageReq.get('MSH.12').toString()).toBe('2.7')
        await res.sendResponse('AA')
      })

      // await expectEvent(IB_ADT, 'listen')

      const client = new Client({ host: '0.0.0.0' })
      let count: number = 0
      const OB_ADT = client.createOutbound({ port: LISTEN_PORT }, async (res) => {
        const messageRes = res.getMessage()
        expect(messageRes.get('MSA.1').toString()).toBe('AA')
        count += 1
        if (count === 2) {
          dfd.resolve()
        }
      })

      await expectEvent(OB_ADT, 'client.connect')

      const fileBatch = await OB_ADT.readFile(`temp/${fileName as string}`)

      await OB_ADT.sendMessage(fileBatch)

      await dfd.promise

      await OB_ADT.close()
      await IB_ADT.close()
    })
  })
})
