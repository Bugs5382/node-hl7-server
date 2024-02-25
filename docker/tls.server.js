const { Server } = require('node-hl7-server')
const fs = require('node:fs')
const path = require('node:path')

const server = new Server({
  bindAddress: 'localhost',
  tls: {
    key: fs.readFileSync(path.join('certs/', 'server-key.pem')),
    cert: fs.readFileSync(path.join('certs/', 'server-crt.pem')),
    rejectUnauthorized: false
  }
})

const inbound = server.createInbound({ port: 3000 }, async (req, res) => {
  await res.sendResponse('AA')
})

inbound.on('client.close', () => {
  console.log('Client Disconnected')
})

inbound.on('client.connect', () => {
  console.log('Client Connected')
})

inbound.on('data.raw', (data) => {
  console.log('Raw Data:', data)
})

inbound.on('listen', () => {
  console.log('Ready to Listen for Messages')
})
