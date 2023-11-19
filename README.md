## Node HL7 Server
Node.js client library for creating a HL7 Server which can accept incoming a properly formatted HL7 message(s), and then parses the HL7 message. Once the message has been parsed you can then do something with the final result that you so desire.

Benefits:

- No other main dependencies (other than the sister app called ```node-hl7-client`` which also uses no dependencies), making this ultra-fast.
- Automatically re-connect, re-subscribe, or retry sending
- Written in typescript and published with heavily commented type definitions
- Intuitive API with named parameters instead of positional
- TLS/SSL Support for clients connecting, if you want.

## Table of Contents

1. [Acknowledgements](#acknowledgements)
2. [License](#license)

## Acknowledgements

-   Code Design Inspiration: [node-rabbitmq-client](https://github.com/cody-greene/node-rabbitmq-client)
-   My Wife and Baby Girl.

## License

Licensed under [MIT](./LICENSE).