import fs from "fs";
import {Batch, Client, Message} from "node-hl7-client";
import path from "node:path";
import portfinder from "portfinder";
import {Server} from "../src";
import {sleep} from "./__utils__";

describe('node hl7 end to end', () => {

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
         const messageRes = res.getMessage()
         expect(messageRes.get('MSA.1').toString()).toBe('AA')
       })
  
       await sleep(5)
  
       let message = new Message({
         messageHeader: {
           msh_9_1: "ADT",
           msh_9_2: "A01",
           msh_10: 'CONTROL_ID',
           msh_11_1: "D"
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
         const messageRes = res.getMessage()
         expect(messageRes.get('MSA.1').toString()).toBe('AA')
       })
  
       await sleep(5)
  
       let message = new Message({
         messageHeader: {
           msh_9_1: "ADT",
           msh_9_2: "A01",
           msh_10: 'CONTROL_ID',
           msh_11_1: "D"
         }
       })
  
       await OB_ADT.sendMessage(message)
  
       await sleep(10)
  
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
         const messageRes = res.getMessage()
         expect(messageRes.get('MSA.1').toRaw()).toBe('AA')
       })
  
       await sleep(5)
  
       let batch = new Batch()
       batch.start()
  
       let message = new Message({
         messageHeader: {
           msh_9_1: "ADT",
           msh_9_2: "A01",
           msh_10: 'CONTROL_ID1',
           msh_11_1: "D"
         }
       })
  
       batch.add(message)
  
       batch.end()

       await OB_ADT.sendMessage(batch)
  
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
         const messageRes = res.getMessage()
         expect(messageRes.get('MSA.1').toString()).toBe('AA')
       })
  
       await sleep(5)
  
       let batch = new Batch()
       batch.start()
  
       let message = new Message({
         messageHeader: {
           msh_9_1: "ADT",
           msh_9_2: "A01",
           msh_10: 'CONTROL_ID',
           msh_11_1: "D"
         }
       })
  
       batch.add(message)
  
       batch.end()
  
       await OB_ADT.sendMessage(batch)
  
       await sleep(10)
  
       await OB_ADT.close()
       await IB_ADT.close()
  
     })
  
   })

})