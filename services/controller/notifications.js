const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const packageDefinition = protoLoader.loadSync('proto/notifications.proto', {
    keepCase: true,
    longs: String,
    enums: String,
    arrays: true,
});

const NotificationService = grpc.loadPackageDefinition(packageDefinition).NotificationService;
const client = new NotificationService('127.0.0.1:3003', grpc.credentials.createInsecure());

module.exports = client;
