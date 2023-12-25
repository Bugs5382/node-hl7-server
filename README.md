## Node HL7 Server
Node.js client library for creating a HL7 Server which can accept incoming a properly formatted HL7 message(s), and then parses the HL7 message. Once the message has been parsed you can then do something with the final result that you so desire.

Benefits:

- No other main dependencies (other than the sister app called [node-hl7-client](https://www.npmjs.com/package/node-hl7-client) which also uses no other external dependencies), making this ultra-fast.
- Automatically re-connect, re-subscribe, or retry sending
- Written in typescript and published with heavily commented type definitions
- Intuitive API with named parameters instead of positional
- TLS/SSL Support for clients connecting, if you want.
- Typescript, CommonJS, ESM formats all available in one package.

## Table of Contents

1. [Acknowledgements](#acknowledgements)
2. [Keyword Definitions](#Keyword-Definitions)
3. [Basic Install](#install)
4. [License](#license)

## Keyword Definitions

This NPM is designed to support medical applications with potential impact on patient care and diagnoses, this package documentation, and it's peer package [node-hl7-server]() follow these definitions when it comes to the documentation.

Keywords such as "MUST", "MUST NOT", "REQUIRED",
"SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL".
These are standardized terms for technology documentation interoperability.
These words should have these meaning when you are reading them.
They might be sans uppercase throughout the documentation, but they would have the same meaning regardless.

* **MUST** - This word, or the terms "**REQUIRED**" or "**SHALL**", mean that the definition is an absolute requirement of the specification.
* **MUST NOT** - This phrase, or the phrase "**SHALL NOT**", mean that the definition is an absolute prohibition of the specification.
* **SHOULD** - This word, or the adjective "**RECOMMENDED**", mean that there may exist valid reasons in particular circumstances to ignore a particular item, but the full implications must be understood and carefully weighed before choosing a different course.
* **SHOULD NOT** - This phrase, or the phrase "**NOT RECOMMENDED**", mean that there may exist valid reasons in particular circumstances when the particular behavior is acceptable or even useful. The full implications should be understood and the case carefully weighed before implementing any behavior described with this label.
* **MAY** - This word, or the adjective "**OPTIONAL**", mean that an item is truly optional.  Any implementation which does not include a particular option MUST be prepared to interoperate with another implementation which does include the option, though perhaps with reduced functionality. In the same vein, an implementation which does include a particular option MUST be prepared to interoperate with another implementation, which does not include the option (except, of course, for the feature the option provides.)

## Install

Install using NPM into your package.

```npm install node-hl7-server```

It has one external dependency of ```node-hl7-client```
as it uses this package to generate the acknowledgement message back to the client
and also parse the informing message from the server.

## Basic Usage

Non-TLS:
```ts
import { Server } from 'node-hl7-server'

const server = new Server()

const IB = server.createInbound({port: 3000}, async (req, res) => {
  const messageReq = req.getMessage()
  const messageRes = res.getAckMessage()
  // do your code here
})
```

This will start a basic server on port 3000 with basic functionally.

Before your app shuts down, you should run:

```ts
await IB.close()
```

To end the connections.

An HL7 server is designed to be up ready to accept connections at any time, so shutting it down shouldn't really happen.
Your app needs to be responsible for memory leaks.
The server does close the connection once it's finished a reply to the client.

TLS:
```ts
import { Server } from 'node-hl7-server'

const server = new Server(
  {
    tls:
      {
        key: fs.readFileSync(path.join('certs/', 'server-key.pem')), // where your certs are
        cert: fs.readFileSync(path.join('certs/', 'server-crt.pem')), // where your certs are
        rejectUnauthorized: false
      }
  })
```

When you get a message, you can then parse any segment of the message and do you need to in order for your app to work.

```ts
const IB_ADT = server.createInbound({port: LISTEN_PORT}, async (req, res) => {
          const messageReq = req.getMessage()
          const messageRes = res.getAckMessage()
          const hl7Version = messageReq.get('MSH.12').toString()
        })
```

In this case... ```res.getAckMessage()``` returns a Message object from ```node-hl7-client```.
Then you can query the segment ```MSH.12``` in this instance and get its result.

Please consult [node-hl7-client](https://www.npmjs.com/package/node-hl7-client) documentation for further ways to parse the message segment.

## Acknowledgements

- Code Design/Auto Re-Connect/Resend, Inspiration: [node-rabbitmq-client](https://github.com/cody-greene/node-rabbitmq-client)
- My Wife and Baby Girl.

## License

Licensed under [MIT](./LICENSE).