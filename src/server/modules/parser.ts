import { Writable } from 'stream'
import { HL7ServerError } from '../../utils/exception.js'

export class Parser extends Writable {
  buf: Buffer | null

  constructor () {
    super()
    this.buf = null
  }

  /** @internal */
  _write (chunk: Buffer, cb: any): void {
    let packet = chunk

    if ((this.buf != null) && this.buf.length > 0) {
      packet = Buffer.concat([this.buf, chunk])
      this.buf = null
    }

    while (packet.length > 0) {
      if (packet.length < 6) {
        this.buf = Buffer.from(packet)
      }

      const crc = packet[1] ^ packet[2] ^ packet[3] ^ packet[4] ^ packet[5]
      if (crc !== packet[0]) {
        return cb(new HL7ServerError(500, `Invalid packet CRC: ${crc}`))
      }

      const length = packet.readInt32BE(1)

      if (packet.length >= length) {
        const msg = packet.slice(6, length)
        this.emit('data', msg)
        packet = packet.slice(length)
      } else {
        this.buf = Buffer.from(packet)
      }
    }
  }
}
