const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const products = require('./products.json');

const packageDefinition = protoLoader.loadSync('proto/inventory.proto', {
    keepCase: true,
    longs: String,
    enums: String,
    arrays: true,
});

const inventoryProto = grpc.loadPackageDefinition(packageDefinition);

// Carrega o proto do serviço de notificações
const notificationsPackageDef = protoLoader.loadSync('proto/notifications.proto', {
    keepCase: true,
    longs: String,
    enums: String,
    arrays: true,
});

const notificationsProto = grpc.loadPackageDefinition(notificationsPackageDef);

// Cliente gRPC para o serviço de notificações
const NOTIFICATION_HOST = process.env.NOTIFICATION_HOST || '127.0.0.1:3003';
const notificationsClient = new notificationsProto.NotificationService(
    NOTIFICATION_HOST,
    grpc.credentials.createInsecure()
);

const server = new grpc.Server();

// implementa os métodos do InventoryService
server.addService(inventoryProto.InventoryService.service, {
    searchAllProducts: (_, callback) => {
        // Adiciona o campo inStock aos produtos
        const productsWithStock = products.map((product) => ({
            ...product,
            inStock: product.quantity > 0,
        }));

        callback(null, {
            products: productsWithStock,
        });
    },

    updateStock: (call, callback) => {
        const { bookId, newQuantity } = call.request;

        // Encontra o produto
        const product = products.find((p) => p.id === bookId);

        if (!product) {
            return callback({
                code: grpc.status.NOT_FOUND,
                message: 'Produto não encontrado',
            });
        }

        const wasOutOfStock = product.quantity === 0;
        product.quantity = newQuantity;
        const isNowInStock = newQuantity > 0;

        // Se o livro estava esgotado e agora voltou ao estoque,
        // notifica o serviço de notificações
        if (wasOutOfStock && isNowInStock) {
            notificationsClient.NotifyStockUpdate(
                {
                    bookId: product.id,
                    bookName: product.name,
                    newQuantity: newQuantity,
                },
                (err, response) => {
                    if (err) {
                        console.error('Erro ao notificar usuários:', err);
                    }
                }
            );
        }

        callback(null, {
            success: true,
            message: 'Estoque atualizado com sucesso',
        });
    },
});

server.bindAsync('0.0.0.0:3002', grpc.ServerCredentials.createInsecure(), () => {
    console.log('Inventory Service running at http://0.0.0.0:3002');
    server.start();
});
