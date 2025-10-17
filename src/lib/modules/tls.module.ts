import * as fs from 'fs';
import * as grpc from '@grpc/grpc-js';

const creds = grpc.ServerCredentials.createSsl(
  fs.readFileSync('ca.crt'), // optional root CA
  [{
    cert_chain: fs.readFileSync('server.crt'),
    private_key: fs.readFileSync('server.key')
  }],
  true
);

export default creds;