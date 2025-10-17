import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

// --- Proto paths ---
const USER_PROTO = path.resolve(__dirname, '../protos/user.proto');
const INFRA_PROTO = path.resolve(__dirname, '../protos/infra.proto');

// --- Load User proto ---
const userPackageDef = protoLoader.loadSync(USER_PROTO, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const userProto = grpc.loadPackageDefinition(userPackageDef) as any;
const userClient = new userProto.user.UserService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

// --- Load Infra proto ---
const infraPackageDef = protoLoader.loadSync(INFRA_PROTO, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const infraProto = grpc.loadPackageDefinition(infraPackageDef) as any;
const infraClient = new infraProto.infra.InfraService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

// --- Call UserService ---
userClient.GetUser({ userId: '123' }, (err: any, response: any) => {
  if (err) console.error('UserService Error:', err);
  else {
    console.log('--- UserService Response (JSON) ---');
    console.log(response);
    const buf = Buffer.from(JSON.stringify(response));
    console.log('Binary (raw):', buf);
    console.log('Binary (hex):', buf.toString('hex'));
  }
});

// --- Call InfraService ---
infraClient.HealthCheck({}, (err: any, response: any) => {
  if (err) console.error('InfraService Error:', err);
  else {
    console.log('--- InfraService Response (JSON) ---');
    console.log(response);
    const buf = Buffer.from(JSON.stringify(response));
    console.log('Binary (raw):', buf);
    console.log('Binary (hex):', buf.toString('hex'));
  }
});
